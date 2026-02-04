import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { createConsultation, updateConsultation, getConsultationById } from '../../api/consultations.api';
import { createPrescription } from '../../api/prescriptions.api';
import { getAllAppointments } from '../../api/appointments.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const ConsultationFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    appointmentId: '',
    diagnosis: '',
    notes: '',
  });

  // Prescription State in Consultation
  const [preservePrescription, setPreservePrescription] = useState(false); // kept (unused) to avoid logic changes
  const [prescriptionItems, setPrescriptionItems] = useState([{ medicineName: '', dosage: '', duration: '' }]);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      const appointmentsData = await getAllAppointments();

      // Filter appointments.
      // In creation mode, only show BOOKED appointments because the backend rule: "Consultation allowed only for BOOKED appointments"
      // In edit mode, we might need to see the linked appointment even if it's now COMPLETED (because saving it changed it to COMPLETED)
      let relevantAppointments = appointmentsData;

      if (!isEditMode) {
        relevantAppointments = appointmentsData.filter((apt) => apt.status === 'BOOKED');
      }

      setAppointments(relevantAppointments);

      if (isEditMode) {
        const consultation = await getConsultationById(id);
        if (consultation) {
          setFormData({
            appointmentId: consultation.appointmentId || '',
            diagnosis: consultation.diagnosis || '',
            notes: consultation.notes || '',
          });
        } else {
          toast({ title: 'Error', description: 'Consultation not found', variant: 'destructive' });
          navigate('/consultations');
        }
      }
    } catch (error) {
      console.error('Failed to load data', error);
      toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Prescription Handlers
  const handlePrescriptionItemChange = (index, field, value) => {
    const newItems = [...prescriptionItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setPrescriptionItems(newItems);
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems((prev) => [...prev, { medicineName: '', dosage: '', duration: '' }]);
  };

  const removePrescriptionItem = (index) => {
    if (prescriptionItems.length === 1) return;
    setPrescriptionItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.appointmentId) newErrors.appointmentId = 'Appointment is required';
    if (!formData.diagnosis) newErrors.diagnosis = 'Diagnosis is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        ...formData,
        appointmentId: parseInt(formData.appointmentId),
      };

      if (isEditMode) {
        await updateConsultation(id, payload);
        toast({ title: 'Success', description: 'Consultation updated successfully', variant: 'success' });
      } else {
        // 1. Create Consultation
        const createdConsultation = await createConsultation(payload);

        // 2. If Prescription items exist and are filled, Create Prescription
        // Check if at least one item has data
        const hasPrescriptionData = prescriptionItems.some((item) => item.medicineName.trim() !== '');

        if (hasPrescriptionData) {
          try {
            // Try to extract ID from various likely properties
            const consultationId = 
                createdConsultation?.consultationId || 
                createdConsultation?.id || 
                createdConsultation?.data?.consultationId || 
                createdConsultation?.data?.id;

            if (consultationId) {
              const prescriptionPayload = {
                consultationId: consultationId,
                issuedDate: new Date().toISOString().split('T')[0],
                prescriptionItems: prescriptionItems.filter((i) => i.medicineName.trim() !== ''),
              };
              await createPrescription(prescriptionPayload);
              toast({ title: 'Success', description: 'Consultation & Prescription saved!', variant: 'success' });
            } else {
              console.warn('No ID returned from consultation creation, skipping prescription.');
              toast({
                title: 'Warning',
                description: 'Consultation saved, but prescription failed (ID missing).',
                variant: 'warning',
              });
            }
          } catch (presError) {
            console.error('Failed to create automatic prescription', presError);
            toast({
              title: 'Warning',
              description: 'Consultation saved, but prescription creation failed.',
              variant: 'warning',
            });
          }
        } else {
          toast({ title: 'Success', description: 'Consultation saved successfully', variant: 'success' });
        }
      }

      navigate('/consultations');
    } catch (err) {
      console.error('Failed to save consultation', err);

      let description = err.response?.data?.message || 'Failed to save consultation';

      if (err.response?.data?.message?.includes('Consultation allowed only for BOOKED')) {
        description = "Cannot create consultation. The appointment must be in 'BOOKED' status.";
      }

      toast({
        title: 'Error',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const formatAppointmentDate = (apt) => {
    // supports both array date format and ISO string
    if (!apt?.appointmentTime) return 'N/A';

    if (Array.isArray(apt.appointmentTime)) {
      const [y, m, d, h = 0, min = 0] = apt.appointmentTime;
      const mm = String(m).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const hh = String(h).padStart(2, '0');
      const mi = String(min).padStart(2, '0');
      return `${y}-${mm}-${dd} ${hh}:${mi}`;
    }

    // string date/time
    const dt = new Date(apt.appointmentTime);
    if (Number.isNaN(dt.getTime())) return String(apt.appointmentTime);

    const y = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    return `${y}-${mm}-${dd} ${hh}:${mi}`;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title={isEditMode ? 'Edit Consultation' : 'New Consultation'}
        description={isEditMode ? 'Update consultation details.' : 'Record a new diagnosis for an appointment.'}
        actions={
          <Button variant="ghost" onClick={() => navigate('/consultations')} icon={ArrowLeft}>
            Back to List
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnosis Details</h3>

            <div className="grid grid-cols-1 gap-6">
              {/* Appointment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment <span className="text-red-500">*</span>
                </label>

                <Select
                  name="appointmentId"
                  value={formData.appointmentId}
                  onChange={handleChange}
                  className={errors.appointmentId ? 'border-red-300 focus:ring-red-500' : ''}
                  disabled={isEditMode}
                >
                  <option value="">Select Appointment</option>
                  {appointments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      #{apt.id} - {formatAppointmentDate(apt)} ({apt.status})
                    </option>
                  ))}
                </Select>

                {isEditMode && (
                  <p className="text-xs text-gray-400 mt-1">Appointment cannot be changed during editing.</p>
                )}
                {!isEditMode && appointments.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">
                    No &apos;BOOKED&apos; appointments available for consultation.
                  </p>
                )}
                {errors.appointmentId && <p className="mt-1 text-sm text-red-500">{errors.appointmentId}</p>}
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis <span className="text-red-500">*</span>
                </label>
                <Input
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  placeholder="e.g. Common Cold, Hypertension"
                  className={errors.diagnosis ? 'border-red-300 focus:ring-red-500' : ''}
                />
                {errors.diagnosis && <p className="mt-1 text-sm text-red-500">{errors.diagnosis}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Clinical notes, observations, prescription details..."
                />
              </div>
            </div>
          </div>

          {/* Integrated Prescription Form (New Consultation Only) */}
          {!isEditMode && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Prescribe Medication</h3>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                {prescriptionItems.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Medicine Name (e.g. Paracetamol)"
                        value={item.medicineName}
                        onChange={(e) => handlePrescriptionItemChange(index, 'medicineName', e.target.value)}
                        className="bg-white"
                      />
                    </div>

                    <div className="w-1/4">
                      <Input
                        placeholder="Dosage (e.g. 500mg)"
                        value={item.dosage}
                        onChange={(e) => handlePrescriptionItemChange(index, 'dosage', e.target.value)}
                        className="bg-white"
                      />
                    </div>

                    <div className="w-1/4">
                      <Input
                        placeholder="Duration (e.g. 3 days)"
                        value={item.duration}
                        onChange={(e) => handlePrescriptionItemChange(index, 'duration', e.target.value)}
                        className="bg-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removePrescriptionItem(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md mt-0.5"
                      disabled={prescriptionItems.length === 1}
                      aria-label="Remove medicine"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={addPrescriptionItem} icon={Plus}>
                  Add Another Medicine
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => navigate('/consultations')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} icon={loading ? undefined : Save}>
              {loading ? 'Saving...' : 'Save Consultation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationFormPage;
