import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../lib/api';
import { formatCurrency, MONTHS_FR } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  CreditCard,
  FileText,
  Home,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    loadEvents();
  }, [currentMonth, currentYear]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await calendarAPI.getEvents(currentMonth, currentYear);
      setEvents(response.data.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert to Monday-based week
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date().getDate());
  };

  const getEventsForDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'payment_due':
        return <AlertCircle className="h-3 w-3" />;
      case 'payment_done':
        return <CheckCircle className="h-3 w-3" />;
      case 'lease_end':
        return <FileText className="h-3 w-3" />;
      case 'vacancy':
        return <Home className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'payment_due':
        return 'bg-amber-500 text-white';
      case 'payment_done':
        return 'bg-emerald-500 text-white';
      case 'lease_end':
        return 'bg-red-500 text-white';
      case 'vacancy':
        return 'bg-slate-500 text-white';
      default:
        return 'bg-primary text-white';
    }
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'payment_due':
        return 'Loyer à percevoir';
      case 'payment_done':
        return 'Loyer perçu';
      case 'lease_end':
        return 'Fin de bail';
      case 'vacancy':
        return 'Début vacance';
      default:
        return type;
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear;

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Calculate stats for the month
  const totalExpected = events
    .filter(e => e.type === 'payment_due' || e.type === 'payment_done')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const totalReceived = events
    .filter(e => e.type === 'payment_done')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const pendingPayments = events.filter(e => e.type === 'payment_due').length;
  const upcomingLeaseEnds = events.filter(e => e.type === 'lease_end').length;

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-8" data-testid="calendar-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Calendrier
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualisez vos échéances et événements
          </p>
        </div>
        <Button variant="outline" onClick={goToToday} data-testid="today-btn">
          Aujourd'hui
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loyers attendus</p>
                <p className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {formatCurrency(totalExpected)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loyers perçus</p>
                <p className="text-xl font-bold text-emerald-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {formatCurrency(totalReceived)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-xl font-bold text-amber-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {pendingPayments}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <FileText className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fins de bail</p>
                <p className="text-xl font-bold text-red-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {upcomingLeaseEnds}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="border lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {MONTHS_FR[currentMonth]} {currentYear}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={previousMonth} data-testid="prev-month-btn">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={nextMonth} data-testid="next-month-btn">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* Day names */}
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before the 1st */}
                {[...Array(firstDay)].map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {/* Days of the month */}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDay(day);
                  const isToday = isCurrentMonth && day === today.getDate();
                  const isSelected = day === selectedDay;
                  
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`
                        aspect-square p-1 rounded-lg transition-colors relative
                        ${isToday ? 'bg-primary text-primary-foreground' : ''}
                        ${isSelected && !isToday ? 'bg-muted ring-2 ring-primary' : ''}
                        ${!isToday && !isSelected ? 'hover:bg-muted' : ''}
                      `}
                      data-testid={`calendar-day-${day}`}
                    >
                      <span className="text-sm font-medium">{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <div 
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                event.type === 'payment_done' ? 'bg-emerald-500' :
                                event.type === 'payment_due' ? 'bg-amber-500' :
                                event.type === 'lease_end' ? 'bg-red-500' : 'bg-slate-500'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Loyer perçu</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Loyer à percevoir</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Fin de bail</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-muted-foreground">Vacance</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Events */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {selectedDay ? (
                `${selectedDay} ${MONTHS_FR[currentMonth]} ${currentYear}`
              ) : (
                'Sélectionnez un jour'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDay ? (
              selectedDayEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-md ${getEventColor(event.type)}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getEventTypeLabel(event.type)}
                          </p>
                          {event.tenant_name && (
                            <p className="text-xs text-muted-foreground">
                              {event.tenant_name}
                            </p>
                          )}
                          {event.amount && (
                            <p className={`text-sm font-semibold mt-1 ${
                              event.type === 'payment_done' ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {formatCurrency(event.amount)}
                            </p>
                          )}
                        </div>
                        {event.is_paid !== undefined && (
                          <Badge variant={event.is_paid ? "default" : "secondary"} className="text-xs">
                            {event.is_paid ? 'Payé' : 'En attente'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Aucun événement ce jour</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  Cliquez sur un jour pour voir les événements
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
