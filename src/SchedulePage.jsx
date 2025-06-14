import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import html2canvas from "html2canvas";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  getDay,
  isToday,
  isPast,
  isWeekend,
} from "date-fns";
import { es } from 'date-fns/locale';

const coordinators = ["Carlos Larez", "Moisés Henríquez", "Samuel Colón"];
const helpers = [
  "Cesar Silvera",
  "Omar Acosta",
  "Rafael Maldonado",
  "Jesús Pimentel",
  "Samuel Rincón",
];

const serviceConfig = {
  0: { name: "Domingo", slots: 4, color: "bg-blue-100", border: "border-blue-300" },
  3: { name: "Miércoles", slots: 2, color: "bg-green-100", border: "border-green-300" },
  6: { name: "Sábado", slots: 2, color: "bg-purple-100", border: "border-purple-300" },
};

const getServiceConfigByDay = (day) => {
  return serviceConfig[getDay(day)] || { name: "", slots: 2, color: "bg-gray-100", border: "border-gray-300" };
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isPrintMode, setIsPrintMode] = useState(false);
  const calendarRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (field, value) => {
    setSelectedDay((prev) => ({ ...prev, [field]: value }));
  };

  const handleSlotChange = (index, value) => {
    const newSlots = [...selectedDay.slots];
    newSlots[index] = value;
    setSelectedDay((prev) => ({ ...prev, slots: newSlots }));
  };

  const handleServiceChange = (value) => {
    const config = Object.values(serviceConfig).find(s => s.name === value);
    const slots = config ? config.slots : 2;

    if (selectedDay) {
      setSelectedDay((prev) => ({
        ...prev,
        service: value,
        slots: Array(slots).fill(""),
      }));
    }
  };

  const handleSave = () => {
    const exists = schedule.find((d) => d.date === selectedDay.date);
    let newSchedule = [...schedule];
    
    if (exists) {
      newSchedule = newSchedule.map((d) =>
        d.date === selectedDay.date ? selectedDay : d
      );
    } else {
      newSchedule.push(selectedDay);
    }
    
    setSchedule(newSchedule);
    localStorage.setItem('illuminationSchedule', JSON.stringify(newSchedule));
    setSelectedDay(null);
  };

  useEffect(() => {
    const savedSchedule = localStorage.getItem('illuminationSchedule');
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    }
  }, []);

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDownloadImage = async () => {
    setIsPrintMode(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Configuración optimizada para JPEG HD
      const canvas = await html2canvas(calendarRef.current, {
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        quality: 0.95,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        ignoreElements: (element) => element.classList.contains('no-export'),
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('*').forEach(el => {
            el.style.fontWeight = '500';
            el.style.textRendering = 'optimizeLegibility';
          });
        }
      });

      const link = document.createElement("a");
      link.download = `cronograma-${format(currentMonth, 'MMMM-yyyy', { locale: es })}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();

    } catch (error) {
      console.error("Error al generar la imagen:", error);
    } finally {
      setIsPrintMode(false);
    }
  };

  const openPanelForNewDay = (day = new Date()) => {
    const config = getServiceConfigByDay(day);
    
    setSelectedDay({
      date: format(day, "yyyy-MM-dd"),
      service: config.name,
      coordinator: coordinators[0],
      slots: Array(config.slots).fill(""),
    });
  };

  const closePanel = () => {
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    const match = schedule.find((event) => isSameDay(parseISO(event.date), day));
    
    if (match) {
      setSelectedDay(match);
    } else {
      const config = getServiceConfigByDay(day);
      setSelectedDay({
        date: format(day, "yyyy-MM-dd"),
        service: config.name,
        coordinator: coordinators[0],
        slots: Array(config.slots).fill(""),
      });
    }
  };

  const clearDay = (date) => {
    setSchedule(schedule.filter(d => d.date !== date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 space-y-8 max-w-full mx-auto ${isPrintMode ? 'print-mode' : ''}`}>
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg no-export">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Cronograma de Iluminación</h1>
            <p className="text-blue-100 text-lg">Organización de servicios semanales</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={openPanelForNewDay}
              className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold shadow-md text-lg"
            >
              + Nuevo Servicio
            </Button>
            <Button 
              onClick={handleDownloadImage}
              className="bg-yellow-400 text-gray-800 hover:bg-yellow-300 px-6 py-3 rounded-xl font-semibold shadow-md text-lg"
            >
              Descargar JPEG
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Panel de edición */}
        <div className={`transition-all duration-300 ${selectedDay ? "w-full md:w-96 flex-shrink-0" : "w-0 overflow-hidden"}`}>
          {selectedDay && (
            <Card className="border-0 shadow-xl rounded-2xl sticky top-4 no-export">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h2 className="text-xl font-bold text-gray-800">
                    {format(parseISO(selectedDay.date), "EEEE, d 'de' MMMM", { locale: es })}
                  </h2>
                  <button 
                    onClick={closePanel}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Servicio:</label>
                    <select
                      value={selectedDay.service}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    >
                      <option value="">Seleccione un servicio</option>
                      {Object.values(serviceConfig).map((service) => (
                        <option key={service.name} value={service.name} className="text-lg">
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Coordinador:</label>
                    <select
                      value={selectedDay.coordinator}
                      onChange={(e) => handleChange("coordinator", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    >
                      {coordinators.map((coord) => (
                        <option key={coord} value={coord} className="text-lg">
                          {coord}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-lg font-medium text-gray-700 mb-2">Servidores:</label>
                    {selectedDay.slots.map((person, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-lg text-gray-500 w-8">#{index + 1}</span>
                        <select
                          value={person}
                          onChange={(e) => handleSlotChange(index, e.target.value)}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                        >
                          <option value="">Seleccione servidor</option>
                          {helpers.map((helper) => (
                            <option key={helper} value={helper} className="text-lg">
                              {helper}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-4">
                  <Button
                    onClick={() => clearDay(selectedDay.date)}
                    variant="destructive"
                    className="flex-1 py-3 text-lg"
                  >
                    Eliminar
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-3 text-lg"
                  >
                    Guardar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Calendario */}
        <div className="flex-grow">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Encabezado del mes */}
            <div className="bg-gray-50 p-4 border-b no-export">
              <div className="flex items-center justify-between">
                <Button 
                  onClick={prevMonth}
                  variant="ghost"
                  size="lg"
                  className="text-gray-600 hover:bg-gray-200 text-lg"
                >
                  ◀
                </Button>
                <h2 className="text-xl font-bold text-gray-800">
                  {format(currentMonth, "MMMM yyyy", { locale: es }).toUpperCase()}
                </h2>
                <Button 
                  onClick={nextMonth}
                  variant="ghost"
                  size="lg"
                  className="text-gray-600 hover:bg-gray-200 text-lg"
                >
                  ▶
                </Button>
              </div>
            </div>

            {/* Vista del calendario */}
            <div className="p-4" ref={calendarRef}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-export">
                {Object.values(serviceConfig).map((service) => (
                  <div key={service.name} className="text-center font-semibold text-gray-700 p-2 text-lg">
                    {service.name.toUpperCase()}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-calendar">
                {monthDays
                  .filter((day) => Object.keys(serviceConfig).includes(getDay(day).toString()))
                  .map((day) => {
                    const match = schedule.find((event) => isSameDay(parseISO(event.date), day));
                    const config = getServiceConfigByDay(day);
                    const isCurrentDay = isToday(day);
                    const isPastDay = isPast(day) && !isCurrentDay;

                    return (
                      <div
                        key={day.toString()}
                        onClick={() => handleDayClick(day)}
                        className={`
                          border rounded-xl p-3 min-h-[180px] cursor-pointer transition-all
                          shadow-sm hover:shadow-md relative
                          ${match ? config.color : 'bg-gray-50'}
                          ${match ? config.border : 'border-gray-200'}
                          ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                          ${isPastDay ? 'opacity-80' : ''}
                          day-cell
                        `}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-start">
                            <span className={`
                              font-bold text-xl
                              ${isWeekend(day) ? 'text-blue-600' : 'text-gray-700'}
                              ${isCurrentDay ? 'text-blue-700' : ''}
                            `}>
                              {format(day, "d")}
                            </span>
                            {isCurrentDay && (
                              <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
                                HOY
                              </span>
                            )}
                          </div>

                          {match ? (
                            <div className="mt-2 flex-grow">
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-800 text-lg">{match.service}</div>
                                <div className="text-gray-600 text-md">{match.coordinator}</div>
                                <div className="border-t border-gray-200 my-1"></div>
                                {match.slots.map((person, idx) => (
                                  <div key={idx} className="text-md">
                                    <span className="font-medium">Serv. {idx + 1}:</span> {person || "---"}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex-grow flex items-center justify-center">
                              <span className="text-gray-400 text-lg">Sin programar</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 no-export">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-blue-600 font-semibold text-lg">Servicios Programados</div>
                <div className="text-3xl font-bold text-blue-800">
                  {schedule.length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="text-green-600 font-semibold text-lg">Este Mes</div>
                <div className="text-3xl font-bold text-green-800">
                  {schedule.filter(e => isSameDay(parseISO(e.date), currentMonth)).length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="text-purple-600 font-semibold text-lg">Servidores</div>
                <div className="text-3xl font-bold text-purple-800">
                  {helpers.length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg no-export">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-yellow-500 mr-2">💡</div>
          <div>
            <h4 className="font-semibold text-yellow-800 text-lg">Notas importantes</h4>
            <p className="text-yellow-700 text-md">
              - Haz clic en cualquier día para programar o editar un servicio.<br />
              - Los días pasados aparecen atenuados.<br />
              - El día actual está resaltado con un borde azul.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}