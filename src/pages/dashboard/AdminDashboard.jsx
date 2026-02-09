import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Banknote,  
  TrendingUp, ArrowUpRight, Activity 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../utils';
import { getAllPatients } from '../../api/patients.api';
import { getAllAppointments } from '../../api/appointments.api';
import { getAllPayments } from '../../api/payments.api';
import { getAllDoctors } from '../../api/doctors.api';
import Spinner from '../../components/Spinner';

// Reuse helper functions or import them if extracted. 
// For now, I'll keep them local to avoid breaking if utils changes.
const parseDate = (dateArr) => {
    if (!dateArr) return new Date();
    if (Array.isArray(dateArr)) {
        return new Date(dateArr[0], dateArr[1] - 1, dateArr[2], dateArr[3] || 0, dateArr[4] || 0);
    }
    return new Date(dateArr);
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

const ScheduleItem = ({ time, patient, doctor, status }) => (
  <div className="flex gap-4 items-center">
    <div className="flex-shrink-0 w-16 text-center">
        <span className="text-sm font-bold text-slate-500 block">{time}</span>
    </div>
    <div className="flex-grow p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
        <div>
            <p className="text-sm font-bold text-slate-900">{patient}</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
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
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          const [patientsData, appointmentsData, paymentsData, doctorsData] = await Promise.all([
            getAllPatients(),
            getAllAppointments(),
            getAllPayments(),
            getAllDoctors()
          ]);
  
          // Calculate Stats
          const totalRevenue = paymentsData.reduce((sum, p) => sum + Number(p.amount || 0), 0);
          
          setStats({
            patients: patientsData.length,
            appointments: appointmentsData.length,
            revenue: totalRevenue,
            doctors: doctorsData.length
          });

          // Calculate Revenue Trend (Last 7 Days)
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
          });

          const trendData = last7Days.map(day => {
            const dayTotal = paymentsData
                .filter(p => {
                    // Try date fields: paymentDate, date, or createdAt
                    const dateVal = p.paymentDate || p.date || p.createdAt;
                    if (!dateVal) return false;
                    
                    const pDate = parseDate(dateVal);
                    // Ensure valid date
                    if (isNaN(pDate.getTime())) return false;

                    return isSameDay(pDate, day);
                })
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);

             return {
                name: day.toLocaleDateString('en-US', { weekday: 'short' }),
                date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: dayTotal
            };
          });
          setRevenueData(trendData);
  
          // Filter Today's Appointments
          const today = new Date();
          const todays = appointmentsData
            .filter(appt => {
                // Correct field is appointmentTime based on AppointmentsListPage
                const dateVal = appt.appointmentTime || appt.appointmentDate;
                if (!dateVal) return false;

                const apptDate = parseDate(dateVal);
                return isSameDay(apptDate, today);
            })
            // Sort by time?
            .sort((a, b) => {
                 const dA = parseDate(a.appointmentTime || a.appointmentDate);
                 const dB = parseDate(b.appointmentTime || b.appointmentDate);
                 return dA - dB;
            })
            .slice(0, 5); // Take top 5
  
          // Map IDs to Names for display
          const enrichedTodays = todays.map(appt => {
             const patient = patientsData.find(p => p.id === appt.patientId);
             const doctor = doctorsData.find(d => d.id === appt.doctorId); // Assuming doctorId exists
             
             return {
                 ...appt,
                 patientName: patient ? patient.name : `Patient #${appt.patientId}`,
                 doctorName: doctor ? doctor.name : appt.doctorName || `Doctor #${appt.doctorId}`
             };
          });

          setTodaysAppointments(enrichedTodays);
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
            // Removed hardcoded trend to reflect real data state
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
            // Removed hardcoded trend to reflect real data state
          />
          <StatCard 
            title="Active Doctors" 
            value={stats.doctors} 
            icon={Activity} 
            color="cyan" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Analytics Chart */}
            <div className="lg:col-span-2 bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900">Revenue Analytics</h2>
                    <p className="text-sm text-gray-500">Income trends over the last 7 days</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 12}} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 12}} 
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`LKR ${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#10b981" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
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
                        const dateObj = parseDate(appt.appointmentTime || appt.appointmentDate);
                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                            <ScheduleItem 
                                key={appt.id || idx}
                                time={timeStr}
                                patient={appt.patientName}
                                doctor={appt.doctorName}
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
    </div>
  );
};

export default AdminDashboard;
