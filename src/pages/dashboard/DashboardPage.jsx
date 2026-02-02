import React from 'react';
import { 
  Users, Calendar, Banknote, Wallet, Plus, 
  TrendingUp, CheckCircle, Phone, ArrowUpRight 
} from 'lucide-react';
import { cn } from '../../utils';

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
  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            <Calendar className="h-4 w-4 text-slate-400 mr-2" />
            This Week
          </button>
          <button className="flex items-center bg-[#00D1FF] hover:bg-[#00B8E6] transition-all text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg shadow-cyan-100">
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
          <StatCard title="Total Patients" value="14,203" icon={Users} color="blue" trend="5.2%" />
          <StatCard title="Today's Appointments" value="42" icon={Calendar} color="cyan" badge="8 Pending" />
          <StatCard title="Today's Income" value="$4,250" icon={Banknote} color="purple" />
          <StatCard title="Total Income" value="$1.2M" icon={Wallet} color="green" />
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
                <span className="text-sm font-semibold text-slate-500">Appointments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900">148</span>
                <span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">+12%</span>
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
              
              {/* The Smooth Wave Path */}
              <path 
                d="M 0 30 C 10 30, 15 35, 25 32 C 35 28, 40 15, 50 22 C 60 28, 65 5, 75 10 C 85 15, 90 28, 100 20" 
                fill="none" stroke="#00D1FF" strokeWidth="1.5" strokeLinecap="round" 
              />
              <path 
                d="M 0 30 C 10 30, 15 35, 25 32 C 35 28, 40 15, 50 22 C 60 28, 65 5, 75 10 C 85 15, 90 28, 100 20 V 40 H 0 Z" 
                fill="url(#chartFill)" 
              />

              {/* Precise Data Points on the line */}
              <circle cx="25" cy="32" r="1.2" fill="white" stroke="#00D1FF" strokeWidth="1" />
              <circle cx="50" cy="22" r="1.2" fill="white" stroke="#00D1FF" strokeWidth="1" />
              <circle cx="75" cy="10" r="1.2" fill="white" stroke="#00D1FF" strokeWidth="1" />
              <circle cx="100" cy="20" r="1.2" fill="white" stroke="#00D1FF" strokeWidth="1" />
            </svg>

            <div className="flex justify-between mt-8 text-[11px] font-bold text-slate-300 uppercase tracking-widest">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-50 p-8 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Recent Activity</h3>
          <div className="space-y-8 flex-grow">
            <ActivityItem 
              icon={<Users className="h-4 w-4" />} 
              color="bg-blue-50 text-blue-500"
              title="New Patient Registered" 
              desc="James Cameron was added by Dr. Smith" 
              time="2 mins ago" 
            />
            <ActivityItem 
              icon={<CheckCircle className="h-4 w-4" />} 
              color="bg-emerald-50 text-emerald-500"
              title="Appointment Completed" 
              desc="Dr. House finished checkup with Sarah J." 
              time="1 hour ago" 
            />
            <ActivityItem 
              icon={<Phone className="h-4 w-4" />} 
              color="bg-orange-50 text-orange-500"
              title="Reschedule Request" 
              desc="Patient Mike R. requested new time" 
              time="3 hours ago" 
            />
          </div>
          <button className="w-full mt-8 py-3.5 rounded-2xl border border-gray-100 text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;