import { useEffect, useReducer, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { cx, SectionHeader, StepPill } from "./shared";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const PALETTE_SIZE = 10;

const IconUndo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M4 7H15C16.8692 7 17.8039 7 18.5 7.40193C18.9561 7.66523 19.3348 8.04394 19.5981 8.49999C20 9.19615 20 10.1308 20 12C20 13.8692 20 14.8038 19.5981 15.5C19.3348 15.9561 18.9561 16.3348 18.5 16.5981C17.8039 17 16.8692 17 15 17H8.00001M4 7L7 4M4 7L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconRedo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M20 7H9.00001C7.13077 7 6.19615 7 5.5 7.40193C5.04395 7.66523 4.66524 8.04394 4.40193 8.49999C4 9.19615 4 10.1308 4 12C4 13.8692 4 14.8038 4.40192 15.5C4.66523 15.9561 5.04394 16.3348 5.5 16.5981C6.19615 17 7.13077 17 9 17H16M20 7L17 4M20 7L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconMoreVertical = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path d="M8 12H8.00901M12.0045 12H12.0135M15.991 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const IconHelp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 17V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="1" cy="1" r="1" transform="matrix(1 0 0 -1 11 9)" fill="currentColor"/>
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 17.25V20h2.75L18.81 8.94l-2.75-2.75L4 17.25z" />
    <path d="M16.06 5.69 18.31 7.94" />
  </svg>
);

const IconCancel = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </svg>
);

const IconSave = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l4 4 10-10" />
  </svg>
);

const IconPaint = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M14.3601 4.07866L15.2869 3.15178C16.8226 1.61607 19.3125 1.61607 20.8482 3.15178C22.3839 4.68748 22.3839 7.17735 20.8482 8.71306L19.9213 9.63993M14.3601 4.07866C14.3601 4.07866 14.4759 6.04828 16.2138 7.78618C17.9517 9.52407 19.9213 9.63993 19.9213 9.63993M14.3601 4.07866L5.83882 12.5999C5.26166 13.1771 4.97308 13.4656 4.7249 13.7838C4.43213 14.1592 4.18114 14.5653 3.97634 14.995C3.80273 15.3593 3.67368 15.7465 3.41556 16.5208L2.32181 19.8021M19.9213 9.63993L11.4001 18.1612C10.8229 18.7383 10.5344 19.0269 10.2162 19.2751C9.84082 19.5679 9.43469 19.8189 9.00498 20.0237C8.6407 20.1973 8.25352 20.3263 7.47918 20.5844L4.19792 21.6782M4.19792 21.6782L3.39584 21.9456C3.01478 22.0726 2.59466 21.9734 2.31063 21.6894C2.0266 21.4053 1.92743 20.9852 2.05445 20.6042L2.32181 19.8021M4.19792 21.6782L2.32181 19.8021" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const IconErase = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M5.50506 11.4096L6.03539 11.9399L5.50506 11.4096ZM3 14.9522H2.25H3ZM9.04776 21V21.75V21ZM11.4096 5.50506L10.8792 4.97473L11.4096 5.50506ZM13.241 17.8444C13.5339 18.1373 14.0088 18.1373 14.3017 17.8444C14.5946 17.5515 14.5946 17.0766 14.3017 16.7837L13.241 17.8444ZM7.21629 9.69832C6.9234 9.40543 6.44852 9.40543 6.15563 9.69832C5.86274 9.99122 5.86274 10.4661 6.15563 10.759L7.21629 9.69832ZM17.9646 12.0601L12.0601 17.9646L13.1208 19.0253L19.0253 13.1208L17.9646 12.0601ZM6.03539 11.9399L11.9399 6.03539L10.8792 4.97473L4.97473 10.8792L6.03539 11.9399ZM6.03539 17.9646C5.18538 17.1146 4.60235 16.5293 4.22253 16.0315C3.85592 15.551 3.75 15.2411 3.75 14.9522H2.25C2.25 15.701 2.56159 16.3274 3.03 16.9414C3.48521 17.538 4.1547 18.2052 4.97473 19.0253L6.03539 17.9646ZM4.97473 10.8792C4.1547 11.6993 3.48521 12.3665 3.03 12.9631C2.56159 13.577 2.25 14.2035 2.25 14.9522H3.75C3.75 14.6633 3.85592 14.3535 4.22253 13.873C4.60235 13.3752 5.18538 12.7899 6.03539 11.9399L4.97473 10.8792ZM12.0601 17.9646C11.2101 18.8146 10.6248 19.3977 10.127 19.7775C9.64651 20.1441 9.33665 20.25 9.04776 20.25V21.75C9.79649 21.75 10.423 21.4384 11.0369 20.97C11.6335 20.5148 12.3008 19.8453 13.1208 19.0253L12.0601 17.9646ZM4.97473 19.0253C5.79476 19.8453 6.46201 20.5148 7.05863 20.97C7.67256 21.4384 8.29902 21.75 9.04776 21.75V20.25C8.75886 20.25 8.449 20.1441 7.9685 19.7775C7.47069 19.3977 6.88541 18.8146 6.03539 17.9646L4.97473 19.0253ZM17.9646 6.03539C18.8146 6.88541 19.3977 7.47069 19.7775 7.9685C20.1441 8.449 20.25 8.75886 20.25 9.04776H21.75C21.75 8.29902 21.4384 7.67256 20.97 7.05863C20.5148 6.46201 19.8453 5.79476 19.0253 4.97473L17.9646 6.03539ZM19.0253 13.1208C19.8453 12.3008 20.5148 11.6335 20.97 11.0369C21.4384 10.423 21.75 9.79649 21.75 9.04776H20.25C20.25 9.33665 20.1441 9.64651 19.7775 10.127C19.3977 10.6248 18.8146 11.2101 17.9646 12.0601L19.0253 13.1208ZM19.0253 4.97473C18.2052 4.1547 17.538 3.48521 16.9414 3.03C16.3274 2.56159 15.701 2.25 14.9522 2.25V3.75C15.2411 3.75 15.551 3.85592 16.0315 4.22253C16.5293 4.60235 17.1146 5.18538 17.9646 6.03539L19.0253 4.97473ZM11.9399 6.03539C12.7899 5.18538 13.3752 4.60235 13.873 4.22253C14.3535 3.85592 14.6633 3.75 14.9522 3.75V2.25C14.2035 2.25 13.577 2.56159 12.9631 3.03C12.3665 3.48521 11.6993 4.1547 10.8792 4.97473L11.9399 6.03539ZM14.3017 16.7837L7.21629 9.69832L6.15563 10.759L13.241 17.8444L14.3017 16.7837Z" fill="currentColor"/>
    <path d="M9 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconFill = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M6.75 6.79904L6.375 7.44856L6.75 6.79904ZM6.20096 6.25L5.55144 6.625L6.20096 6.25ZM17.799 6.25L18.4486 6.625L17.799 6.25ZM17.25 6.79904L17.625 7.44856L17.25 6.79904ZM17.25 2.20096L17.625 1.55144L17.25 2.20096ZM17.799 2.75L18.4486 2.375L17.799 2.75ZM6.75 2.20096L6.375 1.55144L6.75 2.20096ZM6.20096 2.75L5.55144 2.375L6.20096 2.75ZM13.7071 21.7071L13.1768 21.1768L13.7071 21.7071ZM13.7071 14.2929L13.1768 14.8232L13.7071 14.2929ZM10.2929 14.2929L9.76256 13.7626L10.2929 14.2929ZM10.2929 21.7071L10.8232 21.1768L10.2929 21.7071ZM15.4066 10.989L15.2954 10.2473L15.4066 10.989ZM19.4833 10.3775L19.372 9.63581H19.372L19.4833 10.3775ZM21.861 5.76733L22.5588 5.49258V5.49258L21.861 5.76733ZM20.7327 4.63903L20.4579 5.3369L20.7327 4.63903ZM20.9384 10.0438L20.5865 9.38148V9.38148L20.9384 10.0438ZM21.8858 8.94369L22.593 9.19346L22.593 9.19346L21.8858 8.94369ZM12.4845 11.9173L11.9162 11.4278H11.9162L12.4845 11.9173ZM12.0047 14V14.75H12.7423L12.7546 14.0125L12.0047 14ZM5.5 3.75C5.08579 3.75 4.75 4.08579 4.75 4.5C4.75 4.91421 5.08579 5.25 5.5 5.25V3.75ZM8.5 2.75H15.5V1.25H8.5V2.75ZM15.5 6.25H8.5V7.75H15.5V6.25ZM8.5 6.25C8.01889 6.25 7.7082 6.24928 7.47275 6.22794C7.2476 6.20754 7.16586 6.17311 7.125 6.14952L6.375 7.44856C6.68221 7.62593 7.00817 7.69198 7.33735 7.72182C7.65622 7.75072 8.04649 7.75 8.5 7.75V6.25ZM5.25 4.5C5.25 4.95351 5.24928 5.34378 5.27818 5.66265C5.30802 5.99183 5.37407 6.31779 5.55144 6.625L6.85048 5.875C6.82689 5.83414 6.79246 5.7524 6.77206 5.52725C6.75072 5.2918 6.75 4.98111 6.75 4.5H5.25ZM7.125 6.14952C7.01099 6.08369 6.91631 5.98901 6.85048 5.875L5.55144 6.625C5.74892 6.96704 6.03296 7.25108 6.375 7.44856L7.125 6.14952ZM17.25 4.5C17.25 4.98111 17.2493 5.2918 17.2279 5.52725C17.2075 5.7524 17.1731 5.83414 17.1495 5.875L18.4486 6.625C18.6259 6.31779 18.692 5.99183 18.7218 5.66265C18.7507 5.34378 18.75 4.95351 18.75 4.5H17.25ZM15.5 7.75C15.9535 7.75 16.3438 7.75072 16.6627 7.72182C16.9918 7.69198 17.3178 7.62593 17.625 7.44856L16.875 6.14952C16.8341 6.17311 16.7524 6.20754 16.5273 6.22794C16.2918 6.24928 15.9811 6.25 15.5 6.25V7.75ZM17.1495 5.875C17.0837 5.98901 16.989 6.08369 16.875 6.14952L17.625 7.44856C17.967 7.25108 18.2511 6.96704 18.4486 6.625L17.1495 5.875ZM15.5 2.75C15.9811 2.75 16.2918 2.75072 16.5273 2.77206C16.7524 2.79246 16.8341 2.82689 16.875 2.85048L17.625 1.55144C17.3178 1.37407 16.9918 1.30802 16.6627 1.27818C16.3438 1.24928 15.9535 1.25 15.5 1.25V2.75ZM18.75 4.5C18.75 4.04649 18.7507 3.65622 18.7218 3.33735C18.692 3.00817 18.6259 2.68221 18.4486 2.375L17.1495 3.125C17.1731 3.16586 17.2075 3.2476 17.2279 3.47275C17.2493 3.7082 17.25 4.01889 17.25 4.5H18.75ZM16.875 2.85048C16.989 2.91631 17.0837 3.01099 17.1495 3.125L18.4486 2.375C18.2511 2.03296 17.967 1.74892 17.625 1.55144L16.875 2.85048ZM8.5 1.25C8.04649 1.25 7.65622 1.24928 7.33735 1.27818C7.00817 1.30802 6.68221 1.37407 6.375 1.55144L7.125 2.85048C7.16586 2.82689 7.2476 2.79246 7.47275 2.77206C7.7082 2.75072 8.01889 2.75 8.5 2.75V1.25ZM6.75 4.5C6.75 4.01889 6.75072 3.7082 6.77206 3.47275C6.79246 3.2476 6.82689 3.16586 6.85048 3.125L5.55144 2.375C5.37407 2.68221 5.30802 3.00817 5.27818 3.33735C5.24928 3.65622 5.25 4.04649 5.25 4.5H6.75ZM6.375 1.55144C6.03296 1.74892 5.74892 2.03296 5.55144 2.375L6.85048 3.125C6.91631 3.01099 7.01099 2.91631 7.125 2.85048L6.375 1.55144ZM10.75 20V16H9.25V20H10.75ZM13.25 16V20H14.75V16H13.25ZM13.25 20C13.25 20.4926 13.2484 20.7866 13.2201 20.9973C13.2071 21.0939 13.1918 21.1423 13.1828 21.164C13.1808 21.1691 13.1791 21.1724 13.1781 21.1743C13.1771 21.1762 13.1766 21.1771 13.1765 21.1772C13.1765 21.1772 13.1766 21.177 13.1769 21.1766C13.1772 21.1763 13.1772 21.1763 13.1768 21.1768L14.2374 22.2374C14.5465 21.9284 14.6589 21.5527 14.7067 21.1972C14.7516 20.8633 14.75 20.4502 14.75 20H13.25ZM12 22.75C12.4502 22.75 12.8633 22.7516 13.1972 22.7067C13.5527 22.6589 13.9284 22.5465 14.2374 22.2374L13.1768 21.1768C13.1763 21.1772 13.1763 21.1772 13.1767 21.1769C13.177 21.1766 13.1772 21.1765 13.1772 21.1765C13.1771 21.1766 13.1762 21.1771 13.1743 21.1781C13.1724 21.1791 13.1691 21.1808 13.164 21.1828C13.1423 21.1918 13.0939 21.2071 12.9973 21.2201C12.7866 21.2484 12.4926 21.25 12 21.25V22.75ZM12 14.75C12.4926 14.75 12.7866 14.7516 12.9973 14.7799C13.0939 14.7929 13.1423 14.8082 13.164 14.8172C13.1691 14.8192 13.1724 14.8209 13.1743 14.8219C13.1762 14.8229 13.1771 14.8234 13.1772 14.8235C13.1772 14.8235 13.177 14.8234 13.1767 14.8231C13.1763 14.8228 13.1763 14.8228 13.1768 14.8232L14.2374 13.7626C13.9284 13.4535 13.5527 13.3411 13.1972 13.2933C12.8633 13.2484 12.4502 13.25 12 13.25V14.75ZM14.75 16C14.75 15.5498 14.7516 15.1367 14.7067 14.8028C14.6589 14.4473 14.5465 14.0716 14.2374 13.7626L13.1768 14.8232C13.1772 14.8237 13.1772 14.8237 13.1769 14.8234C13.1766 14.823 13.1765 14.8228 13.1765 14.8228C13.1766 14.8229 13.1771 14.8238 13.1781 14.8257C13.1791 14.8276 13.1808 14.8309 13.1828 14.836C13.1918 14.8577 13.2071 14.9061 13.2201 15.0027C13.2484 15.2134 13.25 15.5074 13.25 16H14.75ZM10.75 16C10.75 15.5074 10.7516 15.2134 10.7799 15.0027C10.7929 14.9061 10.8082 14.8577 10.8172 14.836C10.8192 14.8309 10.8209 14.8276 10.8219 14.8257C10.8229 14.8238 10.8234 14.8229 10.8235 14.8228C10.8235 14.8228 10.8234 14.823 10.8231 14.8234C10.8228 14.8237 10.8228 14.8237 10.8232 14.8232L9.76256 13.7626C9.45354 14.0716 9.34109 14.4473 9.2933 14.8028C9.24841 15.1367 9.25 15.5498 9.25 16H10.75ZM12 13.25C11.5498 13.25 11.1367 13.2484 10.8028 13.2933C10.4473 13.3411 10.0716 13.4535 9.76256 13.7626L10.8232 14.8232C10.8237 14.8228 10.8237 14.8228 10.8234 14.8231C10.823 14.8234 10.8228 14.8235 10.8228 14.8235C10.8229 14.8234 10.8238 14.8229 10.8257 14.8219C10.8276 14.8209 10.8309 14.8192 10.836 14.8172C10.8577 14.8082 10.9061 14.7929 11.0027 14.7799C11.2134 14.7516 11.5074 14.75 12 14.75V13.25ZM9.25 20C9.25 20.4502 9.24841 20.8633 9.2933 21.1972C9.34109 21.5527 9.45354 21.9284 9.76256 22.2374L10.8232 21.1768C10.8228 21.1763 10.8228 21.1763 10.8231 21.1766C10.8234 21.177 10.8235 21.1772 10.8235 21.1772C10.8234 21.1771 10.8229 21.1762 10.8219 21.1743C10.8209 21.1724 10.8192 21.1691 10.8172 21.164C10.8082 21.1423 10.7929 21.0939 10.7799 20.9973C10.7516 20.7866 10.75 20.4926 10.75 20H9.25ZM12 21.25C11.5074 21.25 11.2134 21.2484 11.0027 21.2201C10.9061 21.2071 10.8577 21.1918 10.836 21.1828C10.8309 21.1808 10.8276 21.1791 10.8257 21.1781C10.8238 21.1771 10.8229 21.1766 10.8228 21.1765C10.8228 21.1765 10.823 21.1766 10.8234 21.1769C10.8237 21.1772 10.8237 21.1772 10.8232 21.1768L9.76256 22.2374C10.0716 22.5465 10.4473 22.6589 10.8028 22.7067C11.1367 22.7516 11.5498 22.75 12 22.75V21.25ZM15.5179 11.7307L19.5945 11.1192L19.372 9.63581L15.2954 10.2473L15.5179 11.7307ZM19.0449 3.75H18V5.25H19.0449V3.75ZM22.75 7.4551C22.75 7.02002 22.7504 6.65783 22.731 6.3612C22.7113 6.05823 22.6687 5.77171 22.5588 5.49258L21.1631 6.04208C21.1922 6.11609 21.2192 6.22858 21.2342 6.45878C21.2496 6.6953 21.25 7.00043 21.25 7.4551H22.75ZM19.0449 5.25C19.4996 5.25 19.8047 5.25037 20.0412 5.26579C20.2714 5.2808 20.3839 5.30776 20.4579 5.3369L21.0074 3.94117C20.7283 3.83128 20.4418 3.78872 20.1388 3.76897C19.8422 3.74963 19.48 3.75 19.0449 3.75V5.25ZM22.5588 5.49258C22.2793 4.78261 21.7174 4.22069 21.0074 3.94117L20.4579 5.3369C20.7806 5.46395 21.0361 5.71937 21.1631 6.04208L22.5588 5.49258ZM19.5945 11.1192C20.3031 11.0129 20.846 10.9422 21.2904 10.7061L20.5865 9.38148C20.4254 9.4671 20.2001 9.5116 19.372 9.63581L19.5945 11.1192ZM21.25 7.4551C21.25 8.29243 21.2394 8.52185 21.1786 8.69391L22.593 9.19346C22.7606 8.71904 22.75 8.17157 22.75 7.4551H21.25ZM21.2904 10.7061C21.8987 10.3829 22.3636 9.84304 22.593 9.19346L21.1786 8.69391C21.0744 8.98918 20.8631 9.23455 20.5865 9.38148L21.2904 10.7061ZM15.2954 10.2473C14.5021 10.3663 13.8376 10.4646 13.3149 10.6116C12.7718 10.7643 12.2913 10.9923 11.9162 11.4278L13.0528 12.4067C13.1623 12.2796 13.3303 12.1654 13.7209 12.0556C14.1318 11.94 14.6861 11.8555 15.5179 11.7307L15.2954 10.2473ZM12.7546 14.0125C12.7724 12.9469 12.8713 12.6175 13.0528 12.4067L11.9162 11.4278C11.3354 12.1023 11.2717 12.9787 11.2548 13.9875L12.7546 14.0125ZM12 14.75H12.0047V13.25H12V14.75ZM6 3.75H5.5V5.25H6V3.75Z" fill="currentColor"/>
  </svg>
);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const TOOL_CURSOR_CONFIG = {
  paint: {
    path: '<path d="M14.3601 4.07866L15.2869 3.15178C16.8226 1.61607 19.3125 1.61607 20.8482 3.15178C22.3839 4.68748 22.3839 7.17735 20.8482 8.71306L19.9213 9.63993M14.3601 4.07866C14.3601 4.07866 14.4759 6.04828 16.2138 7.78618C17.9517 9.52407 19.9213 9.63993 19.9213 9.63993M14.3601 4.07866L5.83882 12.5999C5.26166 13.1771 4.97308 13.4656 4.7249 13.7838C4.43213 14.1592 4.18114 14.5653 3.97634 14.995C3.80273 15.3593 3.67368 15.7465 3.41556 16.5208L2.32181 19.8021M19.9213 9.63993L11.4001 18.1612C10.8229 18.7383 10.5344 19.0269 10.2162 19.2751C9.84082 19.5679 9.43469 19.8189 9.00498 20.0237C8.6407 20.1973 8.25352 20.3263 7.47918 20.5844L4.19792 21.6782M4.19792 21.6782L3.39584 21.9456C3.01478 22.0726 2.59466 21.9734 2.31063 21.6894C2.0266 21.4053 1.92743 20.9852 2.05445 20.6042L2.32181 19.8021M4.19792 21.6782L2.32181 19.8021" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>',
    dot: { cx: 2, cy: 22 },
    hotspot: "2 22",
  },
  erase: {
    path: '<path d="M5.50506 11.4096L6.03539 11.9399L5.50506 11.4096ZM3 14.9522H2.25H3ZM9.04776 21V21.75V21ZM11.4096 5.50506L10.8792 4.97473L11.4096 5.50506ZM13.241 17.8444C13.5339 18.1373 14.0088 18.1373 14.3017 17.8444C14.5946 17.5515 14.5946 17.0766 14.3017 16.7837L13.241 17.8444ZM7.21629 9.69832C6.9234 9.40543 6.44852 9.40543 6.15563 9.69832C5.86274 9.99122 5.86274 10.4661 6.15563 10.759L7.21629 9.69832ZM17.9646 12.0601L12.0601 17.9646L13.1208 19.0253L19.0253 13.1208L17.9646 12.0601ZM6.03539 11.9399L11.9399 6.03539L10.8792 4.97473L4.97473 10.8792L6.03539 11.9399ZM6.03539 17.9646C5.18538 17.1146 4.60235 16.5293 4.22253 16.0315C3.85592 15.551 3.75 15.2411 3.75 14.9522H2.25C2.25 15.701 2.56159 16.3274 3.03 16.9414C3.48521 17.538 4.1547 18.2052 4.97473 19.0253L6.03539 17.9646ZM4.97473 10.8792C4.1547 11.6993 3.48521 12.3665 3.03 12.9631C2.56159 13.577 2.25 14.2035 2.25 14.9522H3.75C3.75 14.6633 3.85592 14.3535 4.22253 13.873C4.60235 13.3752 5.18538 12.7899 6.03539 11.9399L4.97473 10.8792ZM12.0601 17.9646C11.2101 18.8146 10.6248 19.3977 10.127 19.7775C9.64651 20.1441 9.33665 20.25 9.04776 20.25V21.75C9.79649 21.75 10.423 21.4384 11.0369 20.97C11.6335 20.5148 12.3008 19.8453 13.1208 19.0253L12.0601 17.9646ZM4.97473 19.0253C5.79476 19.8453 6.46201 20.5148 7.05863 20.97C7.67256 21.4384 8.29902 21.75 9.04776 21.75V20.25C8.75886 20.25 8.449 20.1441 7.9685 19.7775C7.47069 19.3977 6.88541 18.8146 6.03539 17.9646L4.97473 19.0253ZM17.9646 6.03539C18.8146 6.88541 19.3977 7.47069 19.7775 7.9685C20.1441 8.449 20.25 8.75886 20.25 9.04776H21.75C21.75 8.29902 21.4384 7.67256 20.97 7.05863C20.5148 6.46201 19.8453 5.79476 19.0253 4.97473L17.9646 6.03539ZM19.0253 13.1208C19.8453 12.3008 20.5148 11.6335 20.97 11.0369C21.4384 10.423 21.75 9.79649 21.75 9.04776H20.25C20.25 9.33665 20.1441 9.64651 19.7775 10.127C19.3977 10.6248 18.8146 11.2101 17.9646 12.0601L19.0253 13.1208ZM19.0253 4.97473C18.2052 4.1547 17.538 3.48521 16.9414 3.03C16.3274 2.56159 15.701 2.25 14.9522 2.25V3.75C15.2411 3.75 15.551 3.85592 16.0315 4.22253C16.5293 4.60235 17.1146 5.18538 17.9646 6.03539L19.0253 4.97473ZM11.9399 6.03539C12.7899 5.18538 13.3752 4.60235 13.873 4.22253C14.3535 3.85592 14.6633 3.75 14.9522 3.75V2.25C14.2035 2.25 13.577 2.56159 12.9631 3.03C12.3665 3.48521 11.6993 4.1547 10.8792 4.97473L11.9399 6.03539ZM14.3017 16.7837L7.21629 9.69832L6.15563 10.759L13.241 17.8444L14.3017 16.7837Z" fill="#0f172a"/><path d="M9 21H21" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round"/>',
    dot: { cx: 2, cy: 22 },
    hotspot: "2 22",
  },
  fill: {
    path: '<path d="M6.75 6.79904L6.375 7.44856L6.75 6.79904ZM6.20096 6.25L5.55144 6.625L6.20096 6.25ZM17.799 6.25L18.4486 6.625L17.799 6.25ZM17.25 6.79904L17.625 7.44856L17.25 6.79904ZM17.25 2.20096L17.625 1.55144L17.25 2.20096ZM17.799 2.75L18.4486 2.375L17.799 2.75ZM6.75 2.20096L6.375 1.55144L6.75 2.20096ZM6.20096 2.75L5.55144 2.375L6.20096 2.75ZM13.7071 21.7071L13.1768 21.1768L13.7071 21.7071ZM13.7071 14.2929L13.1768 14.8232L13.7071 14.2929ZM10.2929 14.2929L9.76256 13.7626L10.2929 14.2929ZM10.2929 21.7071L10.8232 21.1768L10.2929 21.7071ZM15.4066 10.989L15.2954 10.2473L15.4066 10.989ZM19.4833 10.3775L19.372 9.63581H19.372L19.4833 10.3775ZM21.861 5.76733L22.5588 5.49258V5.49258L21.861 5.76733ZM20.7327 4.63903L20.4579 5.3369L20.7327 4.63903ZM20.9384 10.0438L20.5865 9.38148V9.38148L20.9384 10.0438ZM21.8858 8.94369L22.593 9.19346L22.593 9.19346L21.8858 8.94369ZM12.4845 11.9173L11.9162 11.4278H11.9162L12.4845 11.9173ZM12.0047 14V14.75H12.7423L12.7546 14.0125L12.0047 14ZM5.5 3.75C5.08579 3.75 4.75 4.08579 4.75 4.5C4.75 4.91421 5.08579 5.25 5.5 5.25V3.75ZM8.5 2.75H15.5V1.25H8.5V2.75ZM15.5 6.25H8.5V7.75H15.5V6.25ZM8.5 6.25C8.01889 6.25 7.7082 6.24928 7.47275 6.22794C7.2476 6.20754 7.16586 6.17311 7.125 6.14952L6.375 7.44856C6.68221 7.62593 7.00817 7.69198 7.33735 7.72182C7.65622 7.75072 8.04649 7.75 8.5 7.75V6.25ZM5.25 4.5C5.25 4.95351 5.24928 5.34378 5.27818 5.66265C5.30802 5.99183 5.37407 6.31779 5.55144 6.625L6.85048 5.875C6.82689 5.83414 6.79246 5.7524 6.77206 5.52725C6.75072 5.2918 6.75 4.98111 6.75 4.5H5.25ZM7.125 6.14952C7.01099 6.08369 6.91631 5.98901 6.85048 5.875L5.55144 6.625C5.74892 6.96704 6.03296 7.25108 6.375 7.44856L7.125 6.14952ZM17.25 4.5C17.25 4.98111 17.2493 5.2918 17.2279 5.52725C17.2075 5.7524 17.1731 5.83414 17.1495 5.875L18.4486 6.625C18.6259 6.31779 18.692 5.99183 18.7218 5.66265C18.7507 5.34378 18.75 4.95351 18.75 4.5H17.25ZM15.5 7.75C15.9535 7.75 16.3438 7.75072 16.6627 7.72182C16.9918 7.69198 17.3178 7.62593 17.625 7.44856L16.875 6.14952C16.8341 6.17311 16.7524 6.20754 16.5273 6.22794C16.2918 6.24928 15.9811 6.25 15.5 6.25V7.75ZM17.1495 5.875C17.0837 5.98901 16.989 6.08369 16.875 6.14952L17.625 7.44856C17.967 7.25108 18.2511 6.96704 18.4486 6.625L17.1495 5.875ZM15.5 2.75C15.9811 2.75 16.2918 2.75072 16.5273 2.77206C16.7524 2.79246 16.8341 2.82689 16.875 2.85048L17.625 1.55144C17.3178 1.37407 16.9918 1.30802 16.6627 1.27818C16.3438 1.24928 15.9535 1.25 15.5 1.25V2.75ZM18.75 4.5C18.75 4.04649 18.7507 3.65622 18.7218 3.33735C18.692 3.00817 18.6259 2.68221 18.4486 2.375L17.1495 3.125C17.1731 3.16586 17.2075 3.2476 17.2279 3.47275C17.2493 3.7082 17.25 4.01889 17.25 4.5H18.75ZM16.875 2.85048C16.989 2.91631 17.0837 3.01099 17.1495 3.125L18.4486 2.375C18.2511 2.03296 17.967 1.74892 17.625 1.55144L16.875 2.85048ZM8.5 1.25C8.04649 1.25 7.65622 1.24928 7.33735 1.27818C7.00817 1.30802 6.68221 1.37407 6.375 1.55144L7.125 2.85048C7.16586 2.82689 7.2476 2.79246 7.47275 2.77206C7.7082 2.75072 8.01889 2.75 8.5 2.75V1.25ZM6.75 4.5C6.75 4.01889 6.75072 3.7082 6.77206 3.47275C6.79246 3.2476 6.82689 3.16586 6.85048 3.125L5.55144 2.375C5.37407 2.68221 5.30802 3.00817 5.27818 3.33735C5.24928 3.65622 5.25 4.04649 5.25 4.5H6.75ZM6.375 1.55144C6.03296 1.74892 5.74892 2.03296 5.55144 2.375L6.85048 3.125C6.91631 3.01099 7.01099 2.91631 7.125 2.85048L6.375 1.55144ZM10.75 20V16H9.25V20H10.75ZM13.25 16V20H14.75V16H13.25ZM13.25 20C13.25 20.4926 13.2484 20.7866 13.2201 20.9973C13.2071 21.0939 13.1918 21.1423 13.1828 21.164C13.1808 21.1691 13.1791 21.1724 13.1781 21.1743C13.1771 21.1762 13.1766 21.1771 13.1765 21.1772C13.1765 21.1772 13.1766 21.177 13.1769 21.1766C13.1772 21.1763 13.1772 21.1763 13.1768 21.1768L14.2374 22.2374C14.5465 21.9284 14.6589 21.5527 14.7067 21.1972C14.7516 20.8633 14.75 20.4502 14.75 20H13.25ZM12 22.75C12.4502 22.75 12.8633 22.7516 13.1972 22.7067C13.5527 22.6589 13.9284 22.5465 14.2374 22.2374L13.1768 21.1768C13.1763 21.1772 13.1763 21.1772 13.1767 21.1769C13.177 21.1766 13.1772 21.1765 13.1772 21.1765C13.1771 21.1766 13.1762 21.1771 13.1743 21.1781C13.1724 21.1791 13.1691 21.1808 13.164 21.1828C13.1423 21.1918 13.0939 21.2071 12.9973 21.2201C12.7866 21.2484 12.4926 21.25 12 21.25V22.75ZM12 14.75C12.4926 14.75 12.7866 14.7516 12.9973 14.7799C13.0939 14.7929 13.1423 14.8082 13.164 14.8172C13.1691 14.8192 13.1724 14.8209 13.1743 14.8219C13.1762 14.8229 13.1771 14.8234 13.1772 14.8235C13.1772 14.8235 13.177 14.8234 13.1767 14.8231C13.1763 14.8228 13.1763 14.8228 13.1768 14.8232L14.2374 13.7626C13.9284 13.4535 13.5527 13.3411 13.1972 13.2933C12.8633 13.2484 12.4502 13.25 12 13.25V14.75ZM14.75 16C14.75 15.5498 14.7516 15.1367 14.7067 14.8028C14.6589 14.4473 14.5465 14.0716 14.2374 13.7626L13.1768 14.8232C13.1772 14.8237 13.1772 14.8237 13.1769 14.8234C13.1766 14.823 13.1765 14.8228 13.1765 14.8228C13.1766 14.8229 13.1771 14.8238 13.1781 14.8257C13.1791 14.8276 13.1808 14.8309 13.1828 14.836C13.1918 14.8577 13.2071 14.9061 13.2201 15.0027C13.2484 15.2134 13.25 15.5074 13.25 16H14.75ZM10.75 16C10.75 15.5074 10.7516 15.2134 10.7799 15.0027C10.7929 14.9061 10.8082 14.8577 10.8172 14.836C10.8192 14.8309 10.8209 14.8276 10.8219 14.8257C10.8229 14.8238 10.8234 14.8229 10.8235 14.8228C10.8235 14.8228 10.8234 14.823 10.8231 14.8234C10.8228 14.8237 10.8228 14.8237 10.8232 14.8232L9.76256 13.7626C9.45354 14.0716 9.34109 14.4473 9.2933 14.8028C9.24841 15.1367 9.25 15.5498 9.25 16H10.75ZM12 13.25C11.5498 13.25 11.1367 13.2484 10.8028 13.2933C10.4473 13.3411 10.0716 13.4535 9.76256 13.7626L10.8232 14.8232C10.8237 14.8228 10.8237 14.8228 10.8234 14.8231C10.823 14.8234 10.8228 14.8235 10.8228 14.8235C10.8229 14.8234 10.8238 14.8229 10.8257 14.8219C10.8276 14.8209 10.8309 14.8192 10.836 14.8172C10.8577 14.8082 10.9061 14.7929 11.0027 14.7799C11.2134 14.7516 11.5074 14.75 12 14.75V13.25ZM9.25 20C9.25 20.4502 9.24841 20.8633 9.2933 21.1972C9.34109 21.5527 9.45354 21.9284 9.76256 22.2374L10.8232 21.1768C10.8228 21.1763 10.8228 21.1763 10.8231 21.1766C10.8234 21.177 10.8235 21.1772 10.8235 21.1772C10.8234 21.1771 10.8229 21.1762 10.8219 21.1743C10.8209 21.1724 10.8192 21.1691 10.8172 21.164C10.8082 21.1423 10.7929 21.0939 10.7799 20.9973C10.7516 20.7866 10.75 20.4926 10.75 20H9.25ZM12 21.25C11.5074 21.25 11.2134 21.2484 11.0027 21.2201C10.9061 21.2071 10.8577 21.1918 10.836 21.1828C10.8309 21.1808 10.8276 21.1791 10.8257 21.1781C10.8238 21.1771 10.8229 21.1766 10.8228 21.1765C10.8228 21.1765 10.823 21.1766 10.8234 21.1769C10.8237 21.1772 10.8237 21.1772 10.8232 21.1768L9.76256 22.2374C10.0716 22.5465 10.4473 22.6589 10.8028 22.7067C11.1367 22.7516 11.5498 22.75 12 22.75V21.25ZM15.5179 11.7307L19.5945 11.1192L19.372 9.63581L15.2954 10.2473L15.5179 11.7307ZM19.0449 3.75H18V5.25H19.0449V3.75ZM22.75 7.4551C22.75 7.02002 22.7504 6.65783 22.731 6.3612C22.7113 6.05823 22.6687 5.77171 22.5588 5.49258L21.1631 6.04208C21.1922 6.11609 21.2192 6.22858 21.2342 6.45878C21.2496 6.6953 21.25 7.00043 21.25 7.4551H22.75ZM19.0449 5.25C19.4996 5.25 19.8047 5.25037 20.0412 5.26579C20.2714 5.2808 20.3839 5.30776 20.4579 5.3369L21.0074 3.94117C20.7283 3.83128 20.4418 3.78872 20.1388 3.76897C19.8422 3.74963 19.48 3.75 19.0449 3.75V5.25ZM22.5588 5.49258C22.2793 4.78261 21.7174 4.22069 21.0074 3.94117L20.4579 5.3369C20.7806 5.46395 21.0361 5.71937 21.1631 6.04208L22.5588 5.49258ZM19.5945 11.1192C20.3031 11.0129 20.846 10.9422 21.2904 10.7061L20.5865 9.38148C20.4254 9.4671 20.2001 9.5116 19.372 9.63581L19.5945 11.1192ZM21.25 7.4551C21.25 8.29243 21.2394 8.52185 21.1786 8.69391L22.593 9.19346C22.7606 8.71904 22.75 8.17157 22.75 7.4551H21.25ZM21.2904 10.7061C21.8987 10.3829 22.3636 9.84304 22.593 9.19346L21.1786 8.69391C21.0744 8.98918 20.8631 9.23455 20.5865 9.38148L21.2904 10.7061ZM15.2954 10.2473C14.5021 10.3663 13.8376 10.4646 13.3149 10.6116C12.7718 10.7643 12.2913 10.9923 11.9162 11.4278L13.0528 12.4067C13.1623 12.2796 13.3303 12.1654 13.7209 12.0556C14.1318 11.94 14.6861 11.8555 15.5179 11.7307L15.2954 10.2473ZM12.7546 14.0125C12.7724 12.9469 12.8713 12.6175 13.0528 12.4067L11.9162 11.4278C11.3354 12.1023 11.2717 12.9787 11.2548 13.9875L12.7546 14.0125ZM12 14.75H12.0047V13.25H12V14.75ZM6 3.75H5.5V5.25H6V3.75Z" fill="#0f172a"/>',
    dot: { cx: 2, cy: 2 },
    hotspot: "2 2",
  },
} as const;

const toolCursor = (tool: keyof typeof TOOL_CURSOR_CONFIG, color: string) => {
  const config = TOOL_CURSOR_CONFIG[tool];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none">${config.path}<circle cx="${config.dot.cx}" cy="${config.dot.cy}" r="2.2" fill="${color}" stroke="#0f172a" strokeWidth="0.75"/></svg>`;
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml;utf8,${encoded}") ${config.hotspot}, auto`;
};

const toHex = (value: number) => value.toString(16).padStart(2, "0");

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const normalizePalette = (colors: string[], size: number, fallback: string) => {
  const next = colors.slice(0, size);
  while (next.length < size) {
    next.push(fallback);
  }
  return next;
};

type ResultPanelProps = {
  resultId: string | null;
  resultUrl: string | null;
  resultOriginalUrl: string | null;
  resultDownloadName: string;
  resultDimensions: { width: number; height: number } | null;
  hasEdits: boolean;
  onCommitEdits: (dataUrl: string) => void;
  onDiscardEdits: () => void;
  onClearSelection: () => void;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type PaintState = {
  pointerId: number;
  lastX: number;
  lastY: number;
};

type EditHistoryState = {
  entries: string[];
  index: number;
};

type EditHistoryAction =
  | { type: "reset"; dataUrl: string | null }
  | { type: "push"; dataUrl: string }
  | { type: "undo" }
  | { type: "redo" };

const editHistoryReducer = (state: EditHistoryState, action: EditHistoryAction) => {
  switch (action.type) {
    case "reset":
      return action.dataUrl
        ? { entries: [action.dataUrl], index: 0 }
        : { entries: [], index: -1 };
    case "push": {
      const current = state.entries[state.index];
      if (current === action.dataUrl) {
        return state;
      }
      const nextEntries = state.entries.slice(0, state.index + 1);
      nextEntries.push(action.dataUrl);
      return { entries: nextEntries, index: nextEntries.length - 1 };
    }
    case "undo":
      return state.index > 0 ? { ...state, index: state.index - 1 } : state;
    case "redo":
      return state.index < state.entries.length - 1
        ? { ...state, index: state.index + 1 }
        : state;
    default:
      return state;
  }
};

const ResultPanel = ({
  resultId,
  resultUrl,
  resultOriginalUrl,
  resultDownloadName,
  resultDimensions,
  hasEdits,
  onCommitEdits,
  onDiscardEdits,
  onClearSelection,
}: ResultPanelProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTool, setEditTool] = useState<"paint" | "erase" | "fill">("paint");
  const [brushColor, setBrushColor] = useState("#0f172a");
  const [showGrid, setShowGrid] = useState(false);
  const [previewBackground, setPreviewBackground] = useState<"light" | "dark">("light");
  const [palette, setPalette] = useState<string[]>(
    Array.from({ length: PALETTE_SIZE }, () => "#0f172a")
  );
  const [isPainting, setIsPainting] = useState(false);
  const [hasPendingEdits, setHasPendingEdits] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [editHistory, dispatchEditHistory] = useReducer(editHistoryReducer, {
    entries: [],
    index: -1,
  });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const restoreDialogRef = useRef<HTMLDialogElement | null>(null);
  const cancelDialogRef = useRef<HTMLDialogElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const paintState = useRef<PaintState | null>(null);
  const lastLoadedUrlRef = useRef<string | null>(null);
  const shouldCenterRef = useRef(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    setIsEditing(false);
    setIsPainting(false);
    setHasPendingEdits(false);
    setPalette(Array.from({ length: PALETTE_SIZE }, () => "#0f172a"));
    setShowGrid(false);
    setPreviewBackground("light");
    setShowHelp(false);
    setShowMoreMenu(false);
    dragState.current = null;
    paintState.current = null;
    lastLoadedUrlRef.current = null;
    shouldCenterRef.current = true;
    setImageSize(null);
    dispatchEditHistory({ type: "reset", dataUrl: null });
  }, [resultId]);

  // Close more menu when clicking outside
  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreMenu]);

  const resultWidth = resultDimensions?.width ?? null;
  const resultHeight = resultDimensions?.height ?? null;
  const canUndo = editHistory.index > 0;
  const canRedo =
    editHistory.index >= 0 && editHistory.index < editHistory.entries.length - 1;
  const getCanvasContext = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.imageSmoothingEnabled = false;
    return ctx;
  };

  const drawImageToCanvas = (image: HTMLImageElement, url: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const width = resultWidth ?? image.naturalWidth;
    const height = resultHeight ?? image.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = getCanvasContext(canvas);
    if (!ctx) {
      return;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    lastLoadedUrlRef.current = url;
    setImageSize({ width, height });
    refreshPaletteFromCanvas();
  };

  const loadImageFromUrl = (url: string, options?: { resetHistory?: boolean }) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      drawImageToCanvas(image, url);
      if (options?.resetHistory) {
        dispatchEditHistory({ type: "reset", dataUrl: url });
      }
    };
    image.onerror = () => {
      setImageSize(null);
      if (options?.resetHistory) {
        dispatchEditHistory({ type: "reset", dataUrl: null });
      }
    };
    image.src = url;
  };

  useEffect(() => {
    if (!resultUrl) {
      setImageSize(null);
      dispatchEditHistory({ type: "reset", dataUrl: null });
      return;
    }
    if (resultUrl === lastLoadedUrlRef.current) {
      return;
    }
    loadImageFromUrl(resultUrl, { resetHistory: true });
  }, [resultHeight, resultUrl, resultWidth]);

  const getViewportMetrics = () => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return null;
    }
    const rect = viewport.getBoundingClientRect();
    const style = window.getComputedStyle(viewport);
    const paddingLeft = Number.parseFloat(style.paddingLeft || "0");
    const paddingRight = Number.parseFloat(style.paddingRight || "0");
    const paddingTop = Number.parseFloat(style.paddingTop || "0");
    const paddingBottom = Number.parseFloat(style.paddingBottom || "0");
    const borderLeft = Number.parseFloat(style.borderLeftWidth || "0");
    const borderRight = Number.parseFloat(style.borderRightWidth || "0");
    const borderTop = Number.parseFloat(style.borderTopWidth || "0");
    const borderBottom = Number.parseFloat(style.borderBottomWidth || "0");
    const contentWidth = rect.width - paddingLeft - paddingRight - borderLeft - borderRight;
    const contentHeight = rect.height - paddingTop - paddingBottom - borderTop - borderBottom;
    return { rect, paddingLeft, paddingTop, borderLeft, borderTop, contentWidth, contentHeight };
  };

  useEffect(() => {
    const metrics = getViewportMetrics();
    if (!metrics || !imageSize || !shouldCenterRef.current) {
      return;
    }
    const { contentWidth, contentHeight } = metrics;
    const nextZoom = 1;
    const nextX = (contentWidth - imageSize.width * nextZoom) / 2;
    const nextY = (contentHeight - imageSize.height * nextZoom) / 2;
    setZoom(nextZoom);
    setPan({ x: nextX, y: nextY });
    shouldCenterRef.current = false;
  }, [imageSize]);

  const dimensionLabel =
    resultDimensions && resultDimensions.width && resultDimensions.height
      ? `${resultDimensions.width}x${resultDimensions.height} px`
      : null;
  const hasResult = Boolean(resultUrl);
  const canRestore = hasEdits && Boolean(resultOriginalUrl);
  const previewBackgroundColor =
    previewBackground === "dark" ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.85)";

  function extractPaletteFromCanvas(canvas: HTMLCanvasElement) {
    const ctx = getCanvasContext(canvas);
    if (!ctx) {
      return [];
    }
    const { width, height } = canvas;
    if (!width || !height) {
      return [];
    }
    const data = ctx.getImageData(0, 0, width, height).data;
    const counts = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) {
        continue;
      }
      const hex = `#${toHex(data[i])}${toHex(data[i + 1])}${toHex(data[i + 2])}`;
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, PALETTE_SIZE)
      .map(([hex]) => hex);
  }

  function refreshPaletteFromCanvas() {
    if (isEditing) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const extracted = extractPaletteFromCanvas(canvas);
    setPalette((prev) =>
      normalizePalette(extracted, PALETTE_SIZE, prev[0] ?? brushColor)
    );
  }

  const getCanvasPoint = (event: ReactPointerEvent<HTMLDivElement>) => {
    const metrics = getViewportMetrics();
    if (!metrics || !imageSize) {
      return null;
    }
    const { rect, paddingLeft, paddingTop, borderLeft, borderTop } = metrics;
    const offsetX = event.clientX - rect.left - borderLeft - paddingLeft;
    const offsetY = event.clientY - rect.top - borderTop - paddingTop;
    const x = Math.floor((offsetX - pan.x) / zoom);
    const y = Math.floor((offsetY - pan.y) / zoom);
    if (x < 0 || y < 0 || x >= imageSize.width || y >= imageSize.height) {
      return null;
    }
    return { x, y };
  };

  const drawPixel = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = getCanvasContext(canvas);
    if (!ctx) {
      return;
    }
    if (editTool === "erase") {
      ctx.clearRect(x, y, 1, 1);
      return;
    }
    ctx.fillStyle = brushColor;
    ctx.fillRect(x, y, 1, 1);
  };

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    let x0 = from.x;
    let y0 = from.y;
    const x1 = to.x;
    const y1 = to.y;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      drawPixel(x0, y0);
      if (x0 === x1 && y0 === y1) {
        break;
      }
      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  };

  const pickColor = (point: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = getCanvasContext(canvas);
    if (!ctx) {
      return;
    }
    const data = ctx.getImageData(point.x, point.y, 1, 1).data;
    setBrushColor(`#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`);
  };

  const fillAtPoint = (point: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return false;
    }
    const ctx = getCanvasContext(canvas);
    if (!ctx) {
      return false;
    }
    const { width, height } = canvas;
    const image = ctx.getImageData(0, 0, width, height);
    const data = image.data;
    const startIndex = (point.y * width + point.x) * 4;
    const target = {
      r: data[startIndex],
      g: data[startIndex + 1],
      b: data[startIndex + 2],
      a: data[startIndex + 3],
    };
    const fill = { ...hexToRgb(brushColor), a: 255 };
    if (
      target.r === fill.r &&
      target.g === fill.g &&
      target.b === fill.b &&
      target.a === fill.a
    ) {
      return false;
    }
    const stack: Array<{ x: number; y: number }> = [point];
    while (stack.length) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      const idx = (current.y * width + current.x) * 4;
      if (
        data[idx] !== target.r ||
        data[idx + 1] !== target.g ||
        data[idx + 2] !== target.b ||
        data[idx + 3] !== target.a
      ) {
        continue;
      }
      data[idx] = fill.r;
      data[idx + 1] = fill.g;
      data[idx + 2] = fill.b;
      data[idx + 3] = fill.a;
      if (current.x > 0) {
        stack.push({ x: current.x - 1, y: current.y });
      }
      if (current.x < width - 1) {
        stack.push({ x: current.x + 1, y: current.y });
      }
      if (current.y > 0) {
        stack.push({ x: current.x, y: current.y - 1 });
      }
      if (current.y < height - 1) {
        stack.push({ x: current.x, y: current.y + 1 });
      }
    }
    ctx.putImageData(image, 0, 0);
    return true;
  };

  const commitEdits = (options?: { force?: boolean }) => {
    if (!hasPendingEdits && !options?.force) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    lastLoadedUrlRef.current = dataUrl;
    onCommitEdits(dataUrl);
    dispatchEditHistory({ type: "push", dataUrl });
    setHasPendingEdits(false);
    refreshPaletteFromCanvas();
  };

  const applyHistoryEntry = (dataUrl: string) => {
    if (!dataUrl) {
      return;
    }
    lastLoadedUrlRef.current = dataUrl;
    setHasPendingEdits(false);
    loadImageFromUrl(dataUrl);
    onCommitEdits(dataUrl);
  };

  const handleUndo = () => {
    if (!canUndo) {
      return;
    }
    const nextIndex = editHistory.index - 1;
    const nextUrl = editHistory.entries[nextIndex];
    if (!nextUrl) {
      return;
    }
    dispatchEditHistory({ type: "undo" });
    applyHistoryEntry(nextUrl);
  };

  const handleRedo = () => {
    if (!canRedo) {
      return;
    }
    const nextIndex = editHistory.index + 1;
    const nextUrl = editHistory.entries[nextIndex];
    if (!nextUrl) {
      return;
    }
    dispatchEditHistory({ type: "redo" });
    applyHistoryEntry(nextUrl);
  };

  const copyPaletteColor = async (color: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(color);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = color;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasResult) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0 && event.button !== 2) {
      return;
    }

    if (event.button === 2) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: pan.x,
        originY: pan.y,
      };
      setIsDragging(true);
      return;
    }

    if (isEditing) {
      const point = getCanvasPoint(event);
      if (!point) {
        return;
      }
      event.preventDefault();
      if (event.altKey) {
        pickColor(point);
        return;
      }
      if (editTool === "fill") {
        const didFill = fillAtPoint(point);
        if (didFill) {
          commitEdits({ force: true });
        }
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      paintState.current = {
        pointerId: event.pointerId,
        lastX: point.x,
        lastY: point.y,
      };
      setIsPainting(true);
      setHasPendingEdits(true);
      drawPixel(point.x, point.y);
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const paint = paintState.current;
    if (paint && paint.pointerId === event.pointerId) {
      const point = getCanvasPoint(event);
      if (!point) {
        return;
      }
      drawLine({ x: paint.lastX, y: paint.lastY }, point);
      paintState.current = { ...paint, lastX: point.x, lastY: point.y };
      return;
    }

    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const nextX = drag.originX + (event.clientX - drag.startX);
    const nextY = drag.originY + (event.clientY - drag.startY);
    setPan({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const paint = paintState.current;
    if (paint && paint.pointerId === event.pointerId) {
      const target = event.currentTarget;
      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
      paintState.current = null;
      setIsPainting(false);
      commitEdits();
      return;
    }

    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!hasResult) {
        return;
      }
      event.preventDefault();

      const metrics = getViewportMetrics();
      if (!metrics) {
        return;
      }
      const { rect, paddingLeft, paddingTop, borderLeft, borderTop } = metrics;
      const offsetX = event.clientX - rect.left - borderLeft - paddingLeft;
      const offsetY = event.clientY - rect.top - borderTop - paddingTop;
      const zoomFactor = event.deltaY < 0 ? 1.12 : 0.88;
      const nextZoom = clamp(zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
      if (nextZoom === zoom) {
        return;
      }
      const imageX = (offsetX - pan.x) / zoom;
      const imageY = (offsetY - pan.y) / zoom;
      const nextX = offsetX - imageX * nextZoom;
      const nextY = offsetY - imageY * nextZoom;
      setZoom(nextZoom);
      setPan({ x: nextX, y: nextY });
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [hasResult, pan.x, pan.y, zoom]);

  useEffect(() => {
    if (!isEditing && hasResult) {
      refreshPaletteFromCanvas();
    }
  }, [hasResult, isEditing]);

  const handleStartEditing = () => {
    if (!hasResult) {
      return;
    }
    if (!editHistory.entries.length && resultUrl) {
      dispatchEditHistory({ type: "reset", dataUrl: resultUrl });
    }
    setIsEditing(true);
  };

  const handleSaveEdits = () => {
    if (!hasResult) {
      return;
    }
    commitEdits();
    setIsEditing(false);
  };

  const handleDiscard = () => {
    setHasPendingEdits(false);
    setIsEditing(false);
    onDiscardEdits();
  };

  const openCancelDialog = () => {
    if (!hasPendingEdits) {
      handleDiscard();
      return;
    }
    const dialog = cancelDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  };

  const closeCancelDialog = () => {
    const dialog = cancelDialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  };

  const handleCancelConfirm = () => {
    handleDiscard();
    closeCancelDialog();
  };

  const openRestoreDialog = () => {
    if (!canRestore) {
      return;
    }
    const dialog = restoreDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  };

  const closeRestoreDialog = () => {
    const dialog = restoreDialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  };

  const handleRestoreConfirm = () => {
    handleDiscard();
    closeRestoreDialog();
  };

  const cursorClassName = hasResult
    ? isDragging
      ? "cursor-grabbing"
      : isEditing
        ? "cursor-default"
        : "cursor-grab"
    : "cursor-default";

  const shouldShowToolCursor = isEditing && !isDragging && !isPainting;

  const viewportStyle = {
    backgroundColor: previewBackgroundColor,
    ...(shouldShowToolCursor ? { cursor: toolCursor(editTool, brushColor) } : {}),
  };

  return (
    <section className="panel-card flex flex-col gap-5 reveal" style={{ animationDelay: "220ms" }}>
      <SectionHeader
        title="Result"
        subtitle="PNG preview with crisp grid edges."
        action={<StepPill label="Step 2" />}
      />

      {showHelp && hasResult ? (
        <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-[0.7rem] text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          <ul className="list-disc space-y-1 pl-4">
            <li>Scroll to zoom</li>
            <li>Right-click or drag to pan</li>
            {isEditing ? (
              <>
                <li>Click to {editTool === "fill" ? "fill" : editTool === "erase" ? "erase" : "paint"}</li>
                <li>Alt+click to sample color</li>
              </>
            ) : null}
          </ul>
        </div>
      ) : null}

      {hasResult ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                aria-label="Start editing result"
              >
                <IconEdit />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openCancelDialog}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                  aria-label="Cancel edits"
                >
                  <IconCancel />
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:border-emerald-300/70"
                  aria-label="Save edits"
                >
                  <IconSave />
                </button>
              </>
            )}
          </div>

          {/* Editing tools - only shown when editing */}
          {isEditing ? (
            <>
              {/* Divider */}
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

              {/* Tool selection */}
              <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setEditTool("paint")}
                  className={cx(
                    "inline-flex items-center justify-center rounded-full p-1.5 transition",
                    editTool === "paint"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                  aria-pressed={editTool === "paint"}
                  aria-label="Paint tool"
                >
                  <IconPaint />
                </button>
                <button
                  type="button"
                  onClick={() => setEditTool("erase")}
                  className={cx(
                    "inline-flex items-center justify-center rounded-full p-1.5 transition",
                    editTool === "erase"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                  aria-pressed={editTool === "erase"}
                  aria-label="Erase tool"
                >
                  <IconErase />
                </button>
                <button
                  type="button"
                  onClick={() => setEditTool("fill")}
                  className={cx(
                    "inline-flex items-center justify-center rounded-full p-1.5 transition",
                    editTool === "fill"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                  aria-pressed={editTool === "fill"}
                  aria-label="Fill tool"
                >
                  <IconFill />
                </button>
              </div>

              {/* Brush color */}
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(event) => setBrushColor(event.target.value)}
                  className="h-5 w-5 cursor-pointer rounded-full p-0"
                  aria-label="Brush color"
                />
              </div>

              {/* Undo/Redo */}
              <div className="flex items-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!canUndo || isPainting}
                  className="inline-flex items-center justify-center rounded-l-full px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:disabled:text-slate-600"
                  aria-label="Undo"
                >
                  <IconUndo />
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!canRedo || isPainting}
                  className="inline-flex items-center justify-center rounded-r-full px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:disabled:text-slate-600"
                  aria-label="Redo"
                >
                  <IconRedo />
                </button>
              </div>
            </>
          ) : null}

          {/* Spacer */}
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp((prev) => !prev)}
              className={cx(
                "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200",
                showHelp
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : ""
              )}
              aria-pressed={showHelp}
              aria-label="Toggle help"
              title="Help"
            >
              <IconHelp />
            </button>

            {/* More menu for secondary actions */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setShowMoreMenu((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
                aria-label="More options"
                aria-expanded={showMoreMenu}
              >
                <IconMoreVertical />
              </button>
              {showMoreMenu ? (
                <div className="absolute right-0 top-full z-10 mt-1 min-w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {hasEdits ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        openRestoreDialog();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Restore original
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onClearSelection();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Clear selection
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div
          id="result"
          className="flex min-h-70 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500 dark:text-slate-300"
          aria-live="polite"
        >
          {resultUrl ? (
            <>
                <div
                  ref={viewportRef}
                className={cx(
                  "preview-viewport group relative w-full rounded-2xl border border-slate-200/70 bg-white/70 p-4 sm:p-6 dark:border-slate-700/70 dark:bg-slate-900/60",
                  cursorClassName,
                  isPainting && "cursor-crosshair"
                )}
                  style={viewportStyle}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onContextMenu={(event) => event.preventDefault()}
              >
                <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setShowGrid((prev) => !prev)}
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                    className={cx(
                      "pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border text-slate-500 shadow-sm transition hover:text-slate-700",
                      showGrid
                        ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                        : "border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
                    )}
                    aria-pressed={showGrid}
                    aria-label="Toggle grid"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 9h16M4 15h16M9 4v16M15 4v16" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewBackground((prev) => (prev === "light" ? "dark" : "light"))
                    }
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                    className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-slate-100"
                    aria-label="Toggle preview background"
                  >
                    {previewBackground === "light" ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path
                          d="M14.5 4.5A7.5 7.5 0 0 0 19.5 15a7.5 7.5 0 1 1-5-10.5Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
                {dimensionLabel ? (
                  <span className="tag-pill pointer-events-none absolute left-3 bottom-3">
                    {dimensionLabel}
                  </span>
                ) : null}
                <div
                  className="preview-canvas relative"
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                >
                  <div
                    className={cx(
                      "pixel-grid pointer-events-none absolute left-0 top-0",
                      showGrid ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                      width: imageSize?.width ?? 0,
                      height: imageSize?.height ?? 0,
                    }}
                  />
                  <canvas ref={canvasRef} className="preview-image pixelated" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-[0.6rem] text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                  Palette
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {palette.map((color, index) => {
                    if (!isEditing) {
                      return (
                        <button
                          key={`${color}-${index}`}
                          type="button"
                          onClick={() => copyPaletteColor(color)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[0.55rem] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                          aria-label={`Copy palette color ${color}`}
                          title="Copy hex"
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-slate-200 dark:border-slate-700"
                            style={{ backgroundColor: color }}
                          />
                          <span>{color}</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={`${color}-${index}`}
                        type="button"
                        onClick={() => setBrushColor(color)}
                        className={cx(
                          "h-7 w-7 rounded-md border transition",
                          brushColor.toLowerCase() === color.toLowerCase()
                            ? "border-slate-900 ring-2 ring-slate-900/20 dark:border-slate-100 dark:ring-slate-100/20"
                            : "border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-400"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Select palette color ${index + 1}`}
                        title={`Select ${color}`}
                      />
                    );
                  })}
                </div>
              </div>
              <a
                href={resultUrl}
                download={resultDownloadName}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PNG
              </a>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <svg className="h-8 w-8 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload an image and hit <span className="font-medium text-slate-700 dark:text-slate-300">Snap</span> to see results
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-200/60 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/30 dark:text-slate-400">
        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span>AI pixel outputs snap best when they are slightly oversized.</span>
      </div>

      {canRestore ? (
        <dialog
          ref={restoreDialogRef}
          className="dialog-shell"
          aria-labelledby="restore-dialog-title"
          aria-describedby="restore-dialog-description"
          onCancel={(event) => {
            event.preventDefault();
            closeRestoreDialog();
          }}
        >
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p
                id="restore-dialog-title"
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Restore the original image?
              </p>
              <p
                id="restore-dialog-description"
                className="text-xs text-slate-500 dark:text-slate-300"
              >
                This will replace the current edits with the original image.
              </p>
            </div>
            {resultOriginalUrl ? (
              <img
                src={resultOriginalUrl}
                alt="Original snap preview"
                className="max-h-48 w-full rounded-2xl border border-slate-200 bg-white/80 object-contain p-3 dark:border-slate-700 dark:bg-slate-900/70"
              />
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeRestoreDialog}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
              >
                Keep edits
              </button>
              <button
                type="button"
                onClick={handleRestoreConfirm}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:border-rose-300/70"
              >
                Restore original
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
      <dialog
        ref={cancelDialogRef}
        className="dialog-shell"
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
        onCancel={(event) => {
          event.preventDefault();
          closeCancelDialog();
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <p
              id="cancel-dialog-title"
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Discard edits?
            </p>
            <p
              id="cancel-dialog-description"
              className="text-xs text-slate-500 dark:text-slate-300"
            >
              Unsaved strokes will be lost and the panel will revert to the saved result.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeCancelDialog}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={handleCancelConfirm}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:border-rose-300/70"
            >
              Discard edits
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
};

export default ResultPanel;
