import type { FC } from "react";

interface ChartSkeletonProps {
  minWidthClass?: string;
  opacityClass?: string;
}

const ChartSkeleton: FC<ChartSkeletonProps> = ({
  minWidthClass = "min-w-[400px]",
  opacityClass = "opacity-60",
}) => {
  return (
    <div className={`${minWidthClass} ${opacityClass}`}>
      <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <div
          className="h-full w-full animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800"
        />
      </div>
    </div>
  );
};

export default ChartSkeleton;
