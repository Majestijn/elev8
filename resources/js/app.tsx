import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";

createInertiaApp({
  title: (title) => (title ? `${title} · UrbanLift` : "UrbanLift"),
  resolve: (name) => {
    const pages = import.meta.glob("./pages/**/*.tsx", { eager: true });
    const page = pages[`./pages/${name}.tsx`];
    if (!page) throw new Error(`Inertia page not found: ${name}`);
    return page as { default: React.ComponentType };
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
  progress: {
    color: "#1E66F5",
  },
});
