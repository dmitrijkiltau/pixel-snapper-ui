import { forwardRef } from "react";
import type { PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent, RefObject } from "react";
import Icon from "./Icon";
import { cx } from "./shared";
import type { PreviewBackgroundOption } from "./types";

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

export type EditTool = "paint" | "erase" | "fill";

export const toolCursor = (tool: EditTool, color: string) => {
  const config = TOOL_CURSOR_CONFIG[tool];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none">${config.path}<circle cx="${config.dot.cx}" cy="${config.dot.cy}" r="2.2" fill="${color}" stroke="#0f172a" strokeWidth="0.75"/></svg>`;
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml;utf8,${encoded}") ${config.hotspot}, auto`;
};

export type ResultPreviewProps = {
  viewportRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  hasResult: boolean;
  imageSize: { width: number; height: number } | null;
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  isPainting: boolean;
  isEditing: boolean;
  editTool: EditTool;
  brushColor: string;
  showGrid: boolean;
  previewBackground: PreviewBackgroundOption;
  dimensionLabel: string | null;
  variant: "panel" | "fullscreen";
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onTouchStart: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onTouchMove: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onToggleGrid?: () => void;
  onTogglePreviewBackground?: () => void;
};

const ResultPreview = forwardRef<HTMLDivElement, ResultPreviewProps>(
  (
    {
      viewportRef,
      canvasRef,
      hasResult,
      imageSize,
      zoom,
      pan,
      isDragging,
      isPainting,
      isEditing,
      editTool,
      brushColor,
      showGrid,
      previewBackground,
      dimensionLabel,
      variant,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onToggleGrid,
      onTogglePreviewBackground,
    },
    ref
  ) => {
    const previewBackgroundColor =
      previewBackground === "dark"
        ? "rgba(15, 23, 42, 0.9)"
        : "rgba(255, 255, 255, 0.85)";

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

    if (variant === "fullscreen") {
      return (
        <div
          ref={(node) => {
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            if (viewportRef && "current" in viewportRef) {
              (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          className={cx(
            "h-full w-full relative",
            cursorClassName,
            isPainting && "cursor-crosshair"
          )}
          style={viewportStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onContextMenu={(event) => event.preventDefault()}
        >
          {dimensionLabel ? (
            <span className="tag-pill pointer-events-none absolute left-4 bottom-4 z-10">
              {dimensionLabel}
            </span>
          ) : null}
          <div
            className="preview-canvas relative"
            style={{
              transform: `translate(${Math.round(pan.x)}px, ${Math.round(pan.y)}px) scale(${zoom})`,
            }}
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
      );
    }

    // Panel variant
    return (
      <div
        ref={(node) => {
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          if (viewportRef && "current" in viewportRef) {
            (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        className={cx(
          "preview-viewport group relative w-full rounded-2xl border border-slate-200/70 bg-white/70 p-4 sm:p-6 dark:border-slate-700/70 dark:bg-slate-900/60",
          cursorClassName,
          isPainting && "cursor-crosshair"
        )}
        style={viewportStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
          {onToggleGrid ? (
            <button
              type="button"
              onClick={onToggleGrid}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              className={cx(
                "pointer-events-auto btn-icon-sm rounded-full transition hover:text-ink dark:hover:text-paper",
                showGrid
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : ""
              )}
              aria-pressed={showGrid}
              aria-label="Toggle grid"
            >
              <Icon name="hashtag" className="h-4 w-4" />
            </button>
          ) : null}
          {onTogglePreviewBackground ? (
            <button
              type="button"
              onClick={onTogglePreviewBackground}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              className="pointer-events-auto btn-icon-sm rounded-full transition hover:text-ink dark:hover:text-paper"
              aria-label="Toggle preview background"
            >
              {previewBackground === "light" ? (
                <Icon name="moon" className="h-4 w-4" />
              ) : (
                <Icon name="sun" className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
        {dimensionLabel ? (
          <span className="tag-pill pointer-events-none absolute left-3 bottom-3">
            {dimensionLabel}
          </span>
        ) : null}
        <div
          className="preview-canvas relative"
          style={{
            transform: `translate(${Math.round(pan.x)}px, ${Math.round(pan.y)}px) scale(${zoom})`,
          }}
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
    );
  }
);

ResultPreview.displayName = "ResultPreview";

export default ResultPreview;
