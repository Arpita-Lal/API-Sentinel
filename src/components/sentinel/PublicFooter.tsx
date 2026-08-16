import { Link } from "@tanstack/react-router";
import { FiGithub, FiMail, FiPhone } from "react-icons/fi";
import { Brand } from "./Layout";

export const CONTACT_EMAIL = "chaitanyacoder11@gmail.com";
export const CONTACT_PHONE = "7017231575";

export function PublicFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Brand />
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Runtime BOLA detection, shadow API discovery and AI-powered protection for your entire
            API estate.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <Link to="/features" className="transition-colors hover:text-primary">
            Features
          </Link>
          <a
            href="https://docs.lovable.dev"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-primary"
          >
            Documentation
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <FiGithub className="size-3.5" /> GitHub
          </a>
          <Link to="/contact" className="transition-colors hover:text-primary">
            Contact
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-primary">
            Privacy
          </Link>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} API Sentinel. All rights reserved.</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <FiMail className="size-3.5" /> {CONTACT_EMAIL}
            </a>
            <a
              href={`tel:+91${CONTACT_PHONE}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <FiPhone className="size-3.5" /> +91 {CONTACT_PHONE}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}