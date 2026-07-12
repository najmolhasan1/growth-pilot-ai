'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight,
  Plus, Clock, CheckCircle2, FileText, LayoutGrid, 
  List, CalendarDays, Brain
} from 'lucide-react';

interface ScheduledPost {
  id: string;
  title: string;
  date: string;
  status: 'planned' | 'generated' | 'published';
  priority: 'low' | 'medium' | 'high';
}

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const saved = localStorage.getItem('content_schedule');
    if (saved) {
      // Hydrate the schedule persisted in this browser after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScheduledPosts(JSON.parse(saved));
    }
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Fill empty slots for previous month
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }

  // Fill actual days
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push(i);
  }

  const getPostsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledPosts.filter(p => p.date === dateStr);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center">
            <CalendarDays className="text-violet-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black">Content Calendar</h1>
            <p className="text-sm text-white/40 mt-1">Strategic AI-driven content planning & scheduling</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/[0.03] p-1.5 rounded-xl border border-white/5">
          <button 
            onClick={() => setView('grid')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <LayoutGrid size={14} /> Grid
          </button>
          <button 
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <List size={14} /> List
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-black min-w-[150px]">{monthName} <span className="text-blue-500">{year}</span></h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-white/60 hover:text-white">
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextMonth} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-white/60 hover:text-white">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-violet-600/10 border border-violet-500/30 text-violet-400 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-violet-600 hover:text-white transition-all">
            <Brain size={14} /> AI Auto-Schedule
          </button>
          <button className="px-5 py-2.5 bg-white text-black rounded-xl text-xs font-black flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-white/5">
            <Plus size={14} /> Plan New Post
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'grid' ? (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl overflow-hidden backdrop-blur-xl">
          {/* Weekday labels */}
          <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-4 text-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const posts = day ? getPostsForDay(day) : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              
              return (
                <div key={i} className={`min-h-[140px] p-3 border-r border-b border-white/5 transition-all ${day ? 'hover:bg-white/[0.02]' : 'bg-transparent'}`}>
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-bold ${isToday ? 'w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white' : 'text-white/40'}`}>
                          {day}
                        </span>
                        {day === 1 && <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{monthName.slice(0, 3)}</span>}
                      </div>
                      <div className="space-y-1.5">
                        {posts.map(post => (
                          <div 
                            key={post.id}
                            className={`p-2 rounded-lg border text-[10px] font-medium leading-tight group relative cursor-pointer hover:scale-[1.02] transition-all ${
                              post.status === 'published' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                              post.status === 'generated' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
                              'bg-violet-500/5 border-violet-500/10 text-white/60'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className={`w-1 h-1 rounded-full ${post.priority === 'high' ? 'bg-red-400' : post.priority === 'medium' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                              <span className="uppercase tracking-tighter text-[8px] font-black opacity-40">{post.status}</span>
                            </div>
                            <span className="line-clamp-2">{post.title}</span>
                          </div>
                        ))}
                        {day > new Date().getDate() && posts.length === 0 && (
                          <button className="w-full py-2 border border-dashed border-white/10 rounded-lg text-[9px] font-bold text-white/20 hover:border-blue-500/40 hover:text-blue-400 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                            <Plus size={10} /> Add
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {scheduledPosts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(post => (
            <div key={post.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.05] transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                   post.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' :
                   post.status === 'generated' ? 'bg-blue-500/10 text-blue-400' :
                   'bg-white/5 text-white/40'
                }`}>
                  {post.status === 'published' ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">{post.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-white/40 flex items-center gap-1"><Clock size={10} /> {post.date}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                       post.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                       post.status === 'generated' ? 'bg-blue-500/20 text-blue-400' :
                       'bg-white/10 text-white/40'
                    }`}>{post.status}</span>
                  </div>
                </div>
              </div>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all">Edit Plan</button>
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Total Planned</p>
          <p className="text-3xl font-black">{scheduledPosts.length}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Ready to Publish</p>
          <p className="text-3xl font-black text-blue-400">{scheduledPosts.filter(p => p.status === 'generated').length}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Live This Month</p>
          <p className="text-3xl font-black text-emerald-400">{scheduledPosts.filter(p => p.status === 'published').length}</p>
        </div>
      </div>
    </div>
  );
}
