import type { ComponentType, SVGProps } from "react";
import CodeScanIcon from "../icons/code-scan.svg?react";
import DownloadIcon from "../icons/download.svg?react";
import EraserIcon from "../icons/eraser.svg?react";
import GalleryAddIcon from "../icons/gallery-add.svg?react";
import GalleryCheckIcon from "../icons/gallery-check.svg?react";
import GalleryWideIcon from "../icons/gallery-wide.svg?react";
import HashtagIcon from "../icons/hashtag.svg?react";
import InfoCircleIcon from "../icons/info-circle.svg?react";
import MenuDotsCircleIcon from "../icons/menu-dots-circle.svg?react";
import MoonIcon from "../icons/moon.svg?react";
import PaintRollerIcon from "../icons/paint-roller.svg?react";
import PenNewSquareIcon from "../icons/pen-new-square.svg?react";
import PenIcon from "../icons/pen.svg?react";
import SettingsIcon from "../icons/settings.svg?react";
import SledgehammerIcon from "../icons/sledgehammer.svg?react";
import SunIcon from "../icons/sun.svg?react";
import UndoLeftIcon from "../icons/undo-left.svg?react";
import UndoRightIcon from "../icons/undo-right.svg?react";
import { cx } from "./shared";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const iconMap = {
  "code-scan": CodeScanIcon,
  download: DownloadIcon,
  eraser: EraserIcon,
  "gallery-add": GalleryAddIcon,
  "gallery-check": GalleryCheckIcon,
  "gallery-wide": GalleryWideIcon,
  hashtag: HashtagIcon,
  "info-circle": InfoCircleIcon,
  "menu-dots-circle": MenuDotsCircleIcon,
  moon: MoonIcon,
  "paint-roller": PaintRollerIcon,
  "pen-new-square": PenNewSquareIcon,
  pen: PenIcon,
  settings: SettingsIcon,
  sledgehammer: SledgehammerIcon,
  sun: SunIcon,
  "undo-left": UndoLeftIcon,
  "undo-right": UndoRightIcon,
} as const satisfies Record<string, IconComponent>;

export type IconName = keyof typeof iconMap;

export type IconProps = {
  name: IconName;
  className?: string;
  label?: string;
};

const Icon = ({ name, className, label }: IconProps) => {
  const Svg = iconMap[name];
  const ariaProps = label ? { "aria-label": label, role: "img" } : { "aria-hidden": true };
  return <Svg className={cx("inline-block", className)} {...ariaProps} />;
};

export default Icon;
