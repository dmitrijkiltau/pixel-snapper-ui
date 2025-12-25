import type { ComponentType, SVGProps } from "react";
import DownloadIcon from "../icons/download.svg?react";
import EraserIcon from "../icons/eraser.svg?react";
import InfoCircleIcon from "../icons/info-circle.svg?react";
import MenuDotsCircleIcon from "../icons/menu-dots-circle.svg?react";
import PaintRollerIcon from "../icons/paint-roller.svg?react";
import PenNewSquareIcon from "../icons/pen-new-square.svg?react";
import PenIcon from "../icons/pen.svg?react";
import SettingsIcon from "../icons/settings.svg?react";
import SledgehammerIcon from "../icons/sledgehammer.svg?react";
import UndoLeftIcon from "../icons/undo-left.svg?react";
import UndoRightIcon from "../icons/undo-right.svg?react";
import { cx } from "./shared";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const iconMap = {
  download: DownloadIcon,
  eraser: EraserIcon,
  "info-circle": InfoCircleIcon,
  "menu-dots-circle": MenuDotsCircleIcon,
  "paint-roller": PaintRollerIcon,
  "pen-new-square": PenNewSquareIcon,
  pen: PenIcon,
  settings: SettingsIcon,
  sledgehammer: SledgehammerIcon,
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
