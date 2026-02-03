import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Banknote, Wallet, Plus, 
  TrendingUp, CheckCircle, Phone, ArrowUpRight, Activity 
} from 'lucide-react';
import { cn } from '../../utils';
import { getAllPatients } from '../../api/patients.api';
import { getAllAppointments } from '../../api/appointments.api';
import { getAllPayments } from '../../api/payments.api';
import { getAllLogs } from '../../api/auditLogs.api';
import Spinner from '../../components/Spinner';

// --- Helper Functions ---

const parseDate = (dateArr) => {
    if (!dateArr) return new Date();
    if (Array.isArray(dateArr)) {
        // [yyyy, mm, dd, hh, mm, ss]
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
    return 'Rs. ' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- Sub-components to keep the main return clean ---

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

const ActivityItem = ({ icon, color, title, desc, time }) => (
  <div className="flex gap-4">
    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", color)}>
      {icon}
    </div>
    <div className="flex flex-col">
      <p className="text-[14px] font-bold text-gray-900">{title}</p>
      <p className="text-[13px] text-gray-500 leading-snug">{desc}</p>
      <p className="text-[11px] font-medium text-gray-400 mt-1">{time}</p>
    </div>
  </div>
);

// --- Main Page Component ---

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
      totalPatients: 0,
      todayAppointments: 0,
      todayAppointmentsPending: 0,
      todayIncome: 0,
      totalIncome: 0,
      appointmentTrend: 0 // percentage
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [appointmentHistory, setAppointmentHistory] = useState([]);

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [patients, appointments, payments, logs] = await Promise.all([
                getAllPatients().catch(err => { console.error('Patients API Error', err); return []; }),
                getAllAppointments().catch(err => { console.error('Appointments API Error', err); return []; }),
                getAllPayments().catch(err => { console.error('Payments API Error', err); return []; }),
                getAllLogs().catch(err => { console.error('Logs API Error', err); return []; })
            ]);

            const today = new Date();
            const patientsList = Array.isArray(patients) ? patients : [];
            const appointmentsList = Array.isArray(appointments) ? appointments : [];
            const paymentsList = Array.isArray(payments) ? payments : [];
            const logsList = Array.isArray(logs) ? logs : [];

            // 1. Patient Stats
            const totalPatients = patientsList.length;

            // 2. Appointment Stats
            const todayAppts = appointmentsList.filter(apt => {
                const date = parseDate(apt.dateTime || apt.appointmentTime);
                return isSameDay(date, today);
            });
            const pendingToday = todayAppts.filter(a => a.status === 'Scheduled' || a.status === 'Pending').length;
            
            // Calculate Trend (This week vs Last week simple proxy)
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);
            const thisWeekCount = appointmentsList.filter(a => parseDate(a.dateTime || a.appointmentTime) > oneWeekAgo).length;

            // Chart Data Generation (Last 7 Days)
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                days.push(d);
            }

            const chartPoints = days.map(day => {
                const count = appointmentsList.filter(a => isSameDay(parseDate(a.dateTime || a.appointmentTime), day)).length;
                return {
                    day: day.toLocaleDateString('en-US', { weekday: 'short' }),
                    count,
                    date: day
                };
            });
            setChartData(chartPoints);

            // 3. Financial Stats
            const todayPay = paymentsList
                .filter(p => isSameDay(parseDate(p.paymentDate), today))
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            
            const totalPay = paymentsList.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            // 4. Logs / Activity
            const sortedLogs = logsList.sort((a, b) => {
                const da = parseDate(a.timestamp);
                const db = parseDate(b.timestamp);
                return db - da; // Descending
            }).slice(0, 5);

            setStats({
                totalPatients,
                todayAppointments: todayAppts.length,
                todayAppointmentsPending: pendingToday,
                todayIncome: todayPay,
                totalIncome: totalPay,
                thisWeekCount: thisWeekCount
            });
            setRecentLogs(sortedLogs);
            setLoading(false);

        } catch (error) {
            console.error("Dashboard data load failed", error);
            setLoading(false);
        }
    };


    fetchData();
  }, []);

  if (loading) {
      return <div className="flex justify-center items-center h-screen bg-[#F8FAFC]"><Spinner /></div>;
  }

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/appointments/new')}
            className="flex items-center bg-[#00D1FF] hover:bg-[#00B8E6] transition-all text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg shadow-cyan-100"
          >
            <Plus className="h-4 w-4 mr-2" strokeWidth={3} />
            New Appointment
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Metrics at a glance</h2>
        <p className="text-sm text-slate-400 mb-6">Key performance indicators for the clinic.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Patients" 
            value={stats.totalPatients.toLocaleString()} 
            icon={Users} 
            color="blue" 
            trend="+2.4%" // Hardcoded growth for now or calculate 
          />
          <StatCard 
            title="Today's Appointments" 
            value={stats.todayAppointments} 
            icon={Calendar} 
            color="cyan" 
            badge={`${stats.todayAppointmentsPending} Pending`} 
          />
          <StatCard 
            title="Today's Income" 
            value={formatCurrency(stats.todayIncome)} 
            icon={Banknote} 
            color="purple" 
          />
          <StatCard 
            title="Total Income" 
            value={formatCurrency(stats.totalIncome)} 
            icon={Wallet} 
            color="green" 
          />
        </div>
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Smooth Wave Chart */}
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-gray-50 p-8">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Appointment Trends</h3>
              <p className="text-sm text-slate-400">Traffic over the last 7 days</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                <span className="text-sm font-semibold text-slate-500">Appointments (This Week)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900">{stats.thisWeekCount}</span>
                <span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">Live</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-64 w-full px-2">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                {[1,2,3,4].map(i => <div key={i} className="border-t border-gray-50 w-full" />)}
            </div>

            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00D1FF" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#00D1FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Dynamic Path */}
              {(() => {
                if (chartData.length === 0) return null;
                const maxCount = Math.max(...chartData.map(d => d.count), 10); // Minimum scale of 10
                const width = 100;
                const height = 40;
                const step = width / (chartData.length - 1);
                
                // Map chartData points to SVG coordinates
                const points = chartData.map((d, i) => {
                    const x = i * step;
                    const y = height - ((d.count / maxCount) * (height * 0.7)); // Use 70% of height for max bars
                    return `${x},${y}`;
                });

                // Simple line path
                const pathD = `M ${points.join(' L ')}`;
                const areaD = `${pathD} V ${height} H 0 Z`;

                return (
                    <>
                        <path d={pathD} fill="none" stroke="#00D1FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={areaD} fill="url(#chartFill)" />
                        {points.map((p, i) => {
                            const [cx, cy] = p.split(',');
                            return (
                                <circle key={i} cx={cx} cy={cy} r="1.5" fill="white" stroke="#00D1FF" strokeWidth="1" />
                            );
                        })}
                    </>
                );
              })()}
            </svg>

            <div className="flex justify-between mt-8 text-[11px] font-bold text-slate-300 uppercase tracking-widest">
              {chartData.map((d, i) => (
                  <span key={i}>{d.day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-50 p-8 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Recent Activity</h3>
          <div className="space-y-8 flex-grow">
            {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                    <ActivityItem 
                        key={log.id}
                        icon={<Activity className="h-4 w-4" />} 
                        color="bg-blue-50 text-blue-500"
                        title={log.action} 
                        desc={`${log.entity} (ID: ${log.entityId})`} 
                        time={parseDate(log.timestamp).toLocaleString()} 
                    />
                ))
            ) : (
                <div className="text-center text-gray-400 py-10">No recent activity</div>
            )}
          </div>
          <button onClick={() => window.location.href='/audit-logs'} className="w-full mt-8 py-3.5 rounded-2xl border border-gray-100 text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;