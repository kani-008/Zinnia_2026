import { useState } from 'react';
import { adminFetch } from '../auth/adminFetch';

/**
 * Download a file from an authenticated endpoint.
 *
 * The request carries a bearer token, so a plain <a href> cannot work — it
 * would save a file containing a 401 JSON body, which is a confusing bug to
 * chase. Fetch it, turn it into a blob, click a synthetic anchor.
 */
export function useDownload() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async (path: string, body?: unknown) => {
    setBusy(true);
    setError(null);
    let url: string | null = null;
    try {
      const res = await adminFetch<Response>(path, {
        method: body ? 'POST' : 'GET',
        body: body ? JSON.stringify(body) : undefined,
        raw: true,
      });

      // Trust the server's filename rather than rebuilding it here, so the
      // timestamp in the name matches when the data was actually read.
      const cd = res.headers.get('Content-Disposition') || '';
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
      const name = match ? decodeURIComponent(match[1]) : 'zinnia-export.xlsx';

      url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      setError(e?.message || 'The download failed.');
    } finally {
      if (url) URL.revokeObjectURL(url); // or the blob leaks for the page's life
      setBusy(false);
    }
  };

  return { download, busy, error };
}
