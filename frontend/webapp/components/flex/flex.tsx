import type React from "react";
import type { CSSProperties, ReactNode } from "react";

interface FlexProps {
	direction?: "row" | "col";
	justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
	align?: "start" | "center" | "end" | "stretch" | "baseline";
	wrap?: "nowrap" | "wrap" | "wrap-reverse";
	grow?: "0" | "1";
	shrink?: "0" | "1";
	basis?: "auto" | "full" | "1/2" | "1/3" | "1/4" | "1/5";
	gap?: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12";
	alignSelf?: "auto" | "start" | "center" | "end" | "stretch" | "baseline";
	order?: "0" | "1" | "2" | "3" | "4";
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
}

const Flex: React.FC<FlexProps> = ({
	direction = "row",
	justify = "start",
	align = "start",
	wrap = "nowrap",
	grow = "0",
	shrink = "1",
	basis = "auto",
	gap = "0",
	alignSelf = "auto",
	order = "0",
	className = "",
	style = {},
	children,
}) => {
	const baseClasses = `flex
      flex-${direction}
      justify-${justify}
      items-${align}
      ${wrap === "nowrap" ? "flex-nowrap" : wrap === "wrap-reverse" ? "flex-wrap-reverse" : "flex-wrap"}
      grow-${grow}
      shrink-${shrink}
      basis-${basis}
      gap-${gap}
      ${alignSelf !== "auto" ? `self-${alignSelf}` : ""}
      order-${order}`;

	return (
		<div className={`${baseClasses} ${className}`} style={style}>
			{children}
		</div>
	);
};

export { Flex };
