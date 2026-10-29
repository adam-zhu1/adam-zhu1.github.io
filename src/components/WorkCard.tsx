import { out } from "../lib/router";

/** One row of the smaller work: name, one line, and where it lives. */
export function WorkCard({ href, title, blurb, meta, cta }: {
  href: string; title: string; blurb: string; meta?: string; cta: string;
}) {
  return (
    <li>
      <a className="row" {...out} href={href}>
        <b>{title}</b>
        <p>{blurb}</p>
        <span className="go">{meta && <>{meta} · </>}{cta} &#8599;</span>
      </a>
    </li>
  );
}
