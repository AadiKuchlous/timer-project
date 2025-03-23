import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Play, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

interface Timer {
  id: string;
  percentage: number;
  timeLeft: number;
  color: string;
}

const PRESET_MODES = {
  single: [
    { id: '1', percentage: 0, color: '#cacaca' }
  ],
  multiple: [
    { id: '1', percentage: 0, color: '#cacaca' },
    { id: '2', percentage: 25, color: '#f5a399' },
    { id: '3', percentage: 50, color: '#a1dbdf' },
    { id: '4', percentage: 100, color: '#ffd458' }
  ]
};

function App() {
  const [baseTime, setBaseTime] = useState<number>(35);
  const [baseTimeString, setBaseTimeString] = useState<string>("35");
  const [timers, setTimers] = useState<Timer[]>(
    PRESET_MODES.single.map(timer => ({
      ...timer,
      timeLeft: baseTime * 60
    }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numRows, setNumRows] = useState(1);
  const [numCols, setNumCols] = useState(1);
  const timerGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: number | undefined;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTimers(prevTimers => {
          const allDone = prevTimers.every(timer => timer.timeLeft <= 0);
          if (allDone) {
            setIsRunning(false);
            return prevTimers;
          }
          
          return prevTimers.map(timer => ({
            ...timer,
            timeLeft: Math.max(0, timer.timeLeft - 1)
          }));
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const updateGridLayout = () => {
      setNumCols(Math.ceil(Math.sqrt(timers.length)));
    };

    updateGridLayout();
  }, [timers]);

  const addTimer = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#bdf682', '#D4A5A5', '#9B59B6', '#3498DB'
    ];
    const newTimer: Timer = {
      id: Date.now().toString(),
      percentage: 100,
      timeLeft: baseTime * 60,
      color: colors[timers.length % colors.length]
    };
    setTimers([...timers, newTimer]);
  };

  const removeTimer = (id: string) => {
    setTimers(timers.filter(timer => timer.id !== id));
  };

  const updatePercentage = (id: string, percentage: number) => {
    setTimers(timers.map(timer => {
      percentage = Number.isNaN(percentage) ? 0 : percentage;
      const base_time = Number.isNaN(baseTime) ? 0 : baseTime;
      return timer.id === id 
        ? { ...timer, percentage, timeLeft: (base_time * 60 * (100+percentage)) / 100 }
        : timer
  }));
  };

  const UpdateStartTime = () => {
    setTimers(timers.map(timer => {
      const base_time = Number.isNaN(baseTime) ? 0 : baseTime;
      return { ...timer, timeLeft: (base_time * 60 * (100+timer.percentage)) / 100 }
  }));
  };

  useEffect(() => {
      UpdateStartTime();
  }, [baseTime]);

  const startTimers = () => {
    setTimers(timers.map(timer => ({
      ...timer,
      timeLeft: (baseTime * 60 * (100+timer.percentage)) / 100
    })));
    setIsRunning(true);
  };

  const resetTimers = () => {
    setIsRunning(false);
    setTimers(timers.map(timer => ({
      ...timer,
      timeLeft: (baseTime * 60 * (100+timer.percentage)) / 100
    })));
  };

  const setPresetMode = (mode: keyof typeof PRESET_MODES) => {
    setIsRunning(false);
    setTimers(
      PRESET_MODES[mode].map(timer => ({
        ...timer,
        timeLeft: (baseTime * 60 * (100+timer.percentage)) / 100
      }))
    );
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await timerGridRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Timer</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setPresetMode('single')}
                disabled={isRunning}
                className="px-6 py-2.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 font-medium"
              >
                Base
              </button>
              <button
                onClick={() => setPresetMode('multiple')}
                disabled={isRunning}
                className="px-6 py-2.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50 font-medium"
              >
                Extra Time
              </button>
            </div>
          </div>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Time (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={baseTimeString}
                onChange={(e) => {
                  if (e.target.value == '') {
                    setBaseTimeString(e.target.value);
                    setBaseTime(0);
                    return;
                  }
                  if (Number.isNaN(parseInt(e.target.value))) return;
                  setBaseTimeString(e.target.value);
                  setBaseTime(Math.max(parseInt(e.target.value)));
                }}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={startTimers}
                disabled={isRunning}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Play size={20} /> Start
              </button>
              <button
                onClick={resetTimers}
                className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"
              >
                <RefreshCw size={20} /> Reset
              </button>
              <button
                onClick={addTimer}
                disabled={isRunning}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus size={20} /> Add Timer
              </button>
            </div>
          </div>

          <div 
            ref={timerGridRef} 
            className={`relative grid gap-6 ${isFullscreen ? 'h-screen p-6 bg-gray-100' : ''}`}
            style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
          >
            {timers.map(timer => (
              <div
                key={timer.id}
                className={`rounded-lg p-6 text-gray-800 relative ${
                  isFullscreen ? 'flex flex-col justify-center' : ''
                }`}
                style={{ backgroundColor: timer.color }}
              >
                <button
                  onClick={() => removeTimer(timer.id)}
                  disabled={isRunning}
                  className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
                
                <div className="mb-4">
                  <input
                  type="number"
                  min="0"
                  max="1000"
                  value={String(timer.percentage)}
                  onChange={(e) => {
                    updatePercentage(timer.id, parseInt(e.target.value))
                  }}
                  className="w-full px-3 py-1 rounded border-0 bg-white/20 text-gray-800 placeholder-white/60"
                  disabled={isRunning}
                  />
                </div>
                
                <div className="text-center">
                  <div className={`font-bold mb-2 ${isFullscreen ? 'text-8xl' : 'text-4xl'}`}>
                    {formatTime(timer.timeLeft)}
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={toggleFullscreen}
              className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 shadow-lg z-50"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
