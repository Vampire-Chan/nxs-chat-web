declare module 'process';
declare module 'buffer';
declare module 'events';
declare module 'util';

interface Window {
  global: Window;
  Buffer: any;
  process: any;
}
