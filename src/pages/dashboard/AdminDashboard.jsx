import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Banknote,  
  TrendingUp, ArrowUpRight, Activity 
} from 'lucide-react';
import { cn } from '../../utils';
import { getAllPatients } from '../../api/patients.api';
import { getAllAppointments } from '../../api/appointments.api';
import { getAllPayments } from '../../api/payments.api';
import { getAllDoctors } from '../../api/doctors.api';
import { getAllSchedules } from '../../api/schedules.api';
import Spinner from '../../components/Spinner';

// Helper to parse date data into Date object
const parseDate = (dateData) => {
    if (!dateData) return new Date();
    
    let dateObj;
    if (Array.isArray(dateData)) {
        const [year, month, day, hour, minute, second = 0] = dateData;
        // Note: Java month is 1-12, JS Date month is 0-11
        dateObj = new Date(year, month - 1, day, hour, minute, second);
    } else {
        dateObj = new Date(dateData);
    }

    return isNaN(dateObj.getTime()) ? new Date() : dateObj;
};

const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const formatCurrency = (amount) => {
    return 'LKR ' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const StatCard = ({ title, value, icon: IconComponent, color, trend, badge }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-500',
    cyan: 'bg-cyan-50 text-cyan-500',
    purple: 'bg-purple-50 text-purple-500',
    green: 'bg-green-50 text-green-500',
  };

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[160px]">
      <div className="flex justify-between items-start">
        <div className={cn("p-2.5 rounded-xl", colorClasses[color])}>
          <IconComponent className="h-6 w-6" />
        </div>
        {badge && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-100/50">
            {badge}
          </span>
        )}
        {trend && (
          <span className="flex items-center px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-600">
            <ArrowUpRight className="h-3 w-3 mr-0.5" /> {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[13px] font-medium text-gray-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

const ScheduleItem = ({ time, patientName, patientId, doctor, status }) => (
  <div className="flex gap-4 items-center">
    <div className="flex-shrink-0 w-16 text-center">
        <span className="text-sm font-bold text-slate-500 block">{time}</span>
    </div>
    <div className="flex-grow p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
        <div>
            <p className="text-sm font-bold text-slate-900">{patientName}</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <span className="text-slate-400">Patient ID: #{patientId}</span>
                <span className="mx-1">•</span>
                <span className="font-semibold text-slate-400">Dr. {doctor}</span>
            </p>
        </div>
        <span className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
            (status === 'COMPLETED' || status === 'Completed') ? "bg-emerald-100 text-emerald-700" :
            (status === 'CANCELLED' || status === 'Cancelled') ? "bg-red-100 text-red-700" :
            "bg-blue-100 text-blue-700"
        )}>
            {status || 'Pending'}
        </span>
    </div>
  </div>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
      patients: 0,
      appointments: 0,
      revenue: 0,
      doctors: 0
    });
    const [todaysAppointments, setTodaysAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          const [patientsData, appointmentsData, paymentsData, doctorsData, schedulesData] = await Promise.all([
            getAllPatients(),
            getAllAppointments(),
            getAllPayments(),
            getAllDoctors(),
            getAllSchedules().catch(() => [])
          ]);
  
          // Calculate Stats
          const totalRevenue = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
          
          setStats({
            patients: patientsData.length,
            appointments: appointmentsData.length,
            revenue: totalRevenue,
            doctors: doctorsData.length
          });
  
          // Create maps for lookup
          const doctorMap = {};
          doctorsData.forEach(doc => {
            doctorMap[doc.id] = doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
          });

          const patientMap = {};
          patientsData.forEach(patient => {
            patientMap[patient.id] = patient.name || patient.patientName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
          });

          const scheduleMap = {};
          schedulesData.forEach(schedule => {
            scheduleMap[schedule.id] = schedule.doctorId;
          });
  
          // Filter Today's Appointments with proper doctor resolution
          const today = new Date();
          const todays = appointmentsData
            .filter(appt => {
                const apptDate = parseDate(appt.appointmentTime || appt.appointmentDate);
                return isSameDay(apptDate, today);
            })
            // Resolve doctor name and patient name
            .map(appt => {
              let doctorName = 'Unknown Doctor';
              
              // First try to get from doctor object directly
              if (appt.doctor && appt.doctor.name) {
                doctorName = appt.doctor.name;
              } else if (appt.scheduleId && scheduleMap[appt.scheduleId]) {
                // Look up doctor from schedule
                const doctorId = scheduleMap[appt.scheduleId];
                doctorName = doctorMap[doctorId] || `Doctor #${doctorId}`;
              }

              // Resolve patient name
              let patientName = 'Unknown Patient';
              if (appt.patientName) {
                patientName = appt.patientName;
              } else if (appt.patientId && patientMap[appt.patientId]) {
                patientName = patientMap[appt.patientId];
              }
              
              return {
                ...appt,
                doctorName: doctorName,
                patientName: patientName
              };
            })
            // Sort by appointment time
            .sort((a, b) => {
              const timeA = parseDate(a.appointmentTime || a.appointmentDate).getTime();
              const timeB = parseDate(b.appointmentTime || b.appointmentDate).getTime();
              return timeA - timeB;
            })
            .slice(0, 5); // Take top 5
  
          setTodaysAppointments(todays);
        } catch (error) {
          console.error("Failed to load dashboard data", error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchDashboardData();
    }, []);
  
    if (loading) return <Spinner fullScreen />;
  
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-500 text-sm mt-1">System-wide performance metrics.</p>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Patients" 
            value={stats.patients} 
            icon={Users} 
            color="blue" 
            trend="12% vs last month"
          />
          <StatCard 
            title="Total Appointments" 
            value={stats.appointments} 
            icon={Calendar} 
            color="purple" 
            badge="Today"
          />
          <StatCard 
            title="Total Revenue" 
            value={formatCurrency(stats.revenue)} 
            icon={Banknote} 
            color="green" 
            trend="8% vs last month"
          />
          <StatCard 
            title="Active Doctors" 
            value={stats.doctors} 
            icon={Activity} 
            color="cyan" 
          />
        </div>
  
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Today's Schedule</h2>
                    <p className="text-sm text-gray-500">Upcoming appointments for today</p>
                </div>
                <button onClick={() => navigate('/appointments')} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700">View All</button>
            </div>
            
            <div className="space-y-4">
                {todaysAppointments.length > 0 ? (
                    todaysAppointments.map((appt, idx) => {
                        const dateObj = parseDate(appt.appointmentDate);
                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                            <ScheduleItem 
                                key={appt.id || idx}
                                time={timeStr}
                                patientName={appt.patientName || `Patient #${appt.patientId}`}
                                patientId={appt.patientId}
                                doctor={appt.doctorName || 'Unknown'}
                                status={appt.status}
                            />
                        );
                    })
                ) : (
                    <p className="text-gray-500 text-sm text-center py-8">No appointments scheduled for today.</p>
                )}
            </div>
        </div>
      </div>
    );
  };

export default AdminDashboard;
