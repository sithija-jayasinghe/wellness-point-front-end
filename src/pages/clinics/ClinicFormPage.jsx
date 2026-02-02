import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { createDoctor, updateDoctor, getAllDoctors } from '../../api/doctors.api';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/useToast';

const DoctorFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        specialization: '',
        consultationFee: '',
        status: 'Active'
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);

    useEffect(() => {
        if (isEditMode) fetchDoctor();
        else setInitialLoading(false);
    }, [isEditMode, id]);

    const fetchDoctor = async () => {
        try {
            const doctors = await getAllDoctors();
            const doctor = doctors.find(d => d.id === parseInt(id) || d.id === id);
            if (doctor) {
                setFormData({
                    name: doctor.name || '',
                    specialization: doctor.specialization || '',
                    consultationFee: doctor.consultationFee || '',
                    status: doctor.status || 'Active'
                });
            } else {
                navigate('/doctors');
            }
        } catch (err) {
            navigate('/doctors');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const dataToSubmit = { ...formData, consultationFee: Number(formData.consultationFee) };
            if (isEditMode) {
                await updateDoctor(id, dataToSubmit);
                toast({ title: 'Success', description: 'Updated successfully' });
            } else {
                await createDoctor(dataToSubmit);
                toast({ title: 'Success', description: 'Doctor created' });
            }
            navigate('/doctors');
        } catch (err) {
            toast({ title: 'Error', description: 'Save failed', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <Spinner fullScreen />;

    return (
        /* Top padding එක (pt-4) අඩු කරලා Navbar එකට ලං කළා */
        <div className="min-h-screen bg-[#F8FAFC] pt-4 pb-12 px-4"> 
            <div className="max-w-2xl mx-auto"> {/* Form එකේ පළල loku wadi nisa max-w-2xl damma */}
                
                {/* Header - image_0e1862.png විදිහටම compact කළා */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-[#0F172A] mb-1">
                            {isEditMode ? 'Edit Doctor' : 'Add New Doctor'}
                        </h1>
                        <p className="text-slate-500 text-[13px] font-medium">
                            Create or update doctor profiles.
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/doctors')}
                        className="text-[#334155] font-bold text-[13px] hover:text-slate-900 transition-colors pt-2"
                    >
                        Back to List
                    </button>
                </div>

                {/* Form Card - p-8 damma compact penuma enna */}
                <div className="bg-white rounded-[24px] shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-[#1E293B] block">
                                Doctor Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Dr. John Doe"
                                required
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-[#1E293B] block">
                                Specialization <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleChange}
                                placeholder="e.g. Cardiology"
                                required
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-bold text-[#1E293B] block">
                                    Consultation Fee <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="consultationFee"
                                    type="number"
                                    value={formData.consultationFee}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[12px] font-bold text-[#1E293B] block">Status</label>
                                <div className="relative">
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400 transition-all cursor-pointer"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-5 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/doctors')}
                                className="text-slate-500 font-bold text-[13px] hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#00D1FF] hover:bg-[#00B8E6] text-white px-7 py-2.5 rounded-xl font-bold text-[13px] shadow-md shadow-cyan-100 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : isEditMode ? 'Update Doctor' : 'Create Doctor'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DoctorFormPage;