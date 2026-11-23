/* App-wide state and constants. */
'use strict';
/* ---------- constants ---------- */
var DAYS=[
  {k:'push',  name:'Upper Body Push', full:'Upper Body Push (Shoulders, Triceps & Chest Focused)', sub:'Shoulders, triceps & chest focused', short:'Push',  col:'var(--c-push)'},
  {k:'quads', name:'Lower Body Push', full:'Lower Body Push (Quads Focused)',                    sub:'Quads focused',                      short:'Quads', col:'var(--c-quads)'},
  {k:'pull',  name:'Upper Body Pull', full:'Upper Body Pull (Bicep & Back Focused)',             sub:'Biceps & back focused',              short:'Pull',  col:'var(--c-pull)'},
  {k:'glutes',name:'Lower Body Pull', full:'Lower Body Pull (Hamstring & Glutes Focused)',       sub:'Hamstrings & glutes focused',        short:'Glutes',col:'var(--c-glutes)'}
];
var WD=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
var WD3=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
/* Display order of day indexes: Sunday first, then Monday..Saturday. */
var WEEK_ORDER=[6,0,1,2,3,4,5];
var ICON={
  today:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>',
  month:'<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
  progress:'<svg viewBox="0 0 24 24"><path d="M3 19l6-9 4 5 3-4 5 8z"/></svg>',
  settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
};

/* ---------- state ---------- */
var S={tab:'today',monthId:null,week:0,dayIdx:0,logs:{},meta:{custom:[],overrides:{},videos:{},mob:{},cycle:{},dayMap:{},sel:null},
  ready:false,mode:'device',open:{},modal:null,toast:'',theme:'auto',metric:'sessions',pmetric:'weight',exKey:null,exQuery:'',busy:false};
