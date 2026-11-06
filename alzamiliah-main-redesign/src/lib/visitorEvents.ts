import { EventEmitter } from 'events';

const g = globalThis as unknown as { visitorEvents?: EventEmitter };

export const visitorEvents = g.visitorEvents ?? new EventEmitter();
visitorEvents.setMaxListeners(50);

g.visitorEvents = visitorEvents;

export const NEW_VISITOR_EVENT = 'new-visitor';