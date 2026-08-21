import React from 'react';
import { EventMission } from '@packages/types/src';
import { EventCard } from './EventCard';

export interface EventGridProps {
  events: EventMission[];
  onOpenDetails: (event: EventMission) => void;
  onAccept: (eventId: string) => void;
}

export const EventGrid: React.FC<EventGridProps> = ({
  events,
  onOpenDetails,
  onAccept
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((evt) => (
        <EventCard
          key={evt.id}
          event={evt}
          onOpenDetails={onOpenDetails}
          onAccept={onAccept}
        />
      ))}
    </div>
  );
};
