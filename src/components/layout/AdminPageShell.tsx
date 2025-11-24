import type { ReactNode } from "react";
import PageMeta from "../common/PageMeta";
import PageBreadcrumb from "../common/PageBreadCrumb";

interface AdminPageShellProps {
  metaTitle: string;
  metaDescription: string;
  pageTitle: string;
  children: ReactNode;
  showBreadcrumb?: boolean;
  useCard?: boolean;
}

export default function AdminPageShell({
  metaTitle,
  metaDescription,
  pageTitle,
  children,
  showBreadcrumb = true,
  useCard = true,
}: AdminPageShellProps) {
  return (
    <div>
      <PageMeta title={metaTitle} description={metaDescription} />
      {showBreadcrumb && <PageBreadcrumb pageTitle={pageTitle} />}

      {useCard ? (
        <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="w-full">
            <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
              {pageTitle}
            </h3>
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
