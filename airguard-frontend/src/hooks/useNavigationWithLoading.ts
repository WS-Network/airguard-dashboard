import { useRouter } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";

export function useNavigationWithLoading() {
  const router = useRouter();
  const { showPageTransition, showLoading, hideLoading } = useLoading();

  const navigateWithLoading = (href: string) => {
    showPageTransition();

    // Add a small delay to show the loading state
    setTimeout(() => {
      router.replace(href);
    }, 100);
  };

  const navigateWithCustomLoading = (href: string, delay: number = 1000) => {
    showLoading();

    setTimeout(() => {
      router.replace(href);
      hideLoading();
    }, delay);
  };

  return {
    navigateWithLoading,
    navigateWithCustomLoading,
  };
}
