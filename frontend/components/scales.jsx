import React from "react";

export const Scales = () => {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 z-0 h-full w-8 border-x border-slate-700/45 bg-[repeating-linear-gradient(315deg,rgba(148,163,184,0.2)_0,rgba(148,163,184,0.2)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-0 h-full w-8 border-x border-slate-700/45 bg-[repeating-linear-gradient(315deg,rgba(148,163,184,0.2)_0,rgba(148,163,184,0.2)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px]"
      />
    </>
  );
};