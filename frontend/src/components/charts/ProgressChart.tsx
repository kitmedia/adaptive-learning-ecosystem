import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Sample data for progress over time
const weeklyProgressData = [
  { week: 'Sem 1', progress: 20, studyHours: 8, completedLessons: 3 },
  { week: 'Sem 2', progress: 35, studyHours: 12, completedLessons: 7 },
  { week: 'Sem 3', progress: 45, studyHours: 15, completedLessons: 12 },
  { week: 'Sem 4', progress: 67, studyHours: 18, completedLessons: 18 },
  { week: 'Sem 5', progress: 78, studyHours: 22, completedLessons: 23 },
  { week: 'Sem 6', progress: 89, studyHours: 25, completedLessons: 28 },
];

// Course distribution data
const courseDistributionData = [
  { name: 'IA & ML', value: 35, color: '#3b82f6' },
  { name: 'Desarrollo Web', value: 30, color: '#10b981' },
  { name: 'Data Science', value: 25, color: '#f97316' },
  { name: 'Otros', value: 10, color: '#8b5cf6' },
];

// Study time by day
const dailyStudyData = [
  { day: 'Lun', hours: 3.5, target: 4 },
  { day: 'Mar', hours: 4.2, target: 4 },
  { day: 'Mié', hours: 2.8, target: 4 },
  { day: 'Jue', hours: 4.5, target: 4 },
  { day: 'Vie', hours: 3.8, target: 4 },
  { day: 'Sáb', hours: 2.1, target: 4 },
  { day: 'Dom', hours: 3.6, target: 4 },
];

interface ProgressChartProps {
  type: 'line' | 'bar' | 'pie';
  title: string;
  height?: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ type, title, height = 300 }) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={weeklyProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="week" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="progress" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 5, fill: '#3b82f6' }}
                activeDot={{ r: 7, fill: '#1d4ed8' }}
              />
              <Line 
                type="monotone" 
                dataKey="studyHours" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={dailyStudyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="hours" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="target" 
                fill="#e5e7eb"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={courseDistributionData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {courseDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="card-professional p-6">
      <h3 className="heading-3 mb-6">{title}</h3>
      {renderChart()}
      
      {/* Legend for line chart */}
      {type === 'line' && (
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            <span className="text-small">Progreso (%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary-500"></div>
            <span className="text-small">Horas de Estudio</span>
          </div>
        </div>
      )}
      
      {/* Legend for bar chart */}
      {type === 'bar' && (
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            <span className="text-small">Horas Reales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-small">Meta Diaria</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressChart;