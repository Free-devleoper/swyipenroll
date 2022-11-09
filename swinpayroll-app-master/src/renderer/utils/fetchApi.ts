const API_URL = process.env.USE_LOCAL_BACKEND === 'true' ? 'http://localhost:8081' : 'https://api.swinpayroll.xyz';

export default async function fetchApi(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data: Record<string, unknown> = {}, headers: Record<string, string> = {}, files: Record<string, File> = {}) {
  const isGet = method === 'GET';
  const url = new URL(`${API_URL}/api/v1/${endpoint}`);
  if (isGet) {
    url.search = new URLSearchParams(data as Record<string, string>).toString();
  }

  const hasFiles = Object.keys(files).length > 0;
  let body: FormData | string;
  if (hasFiles) {
    body = new FormData();
    for (const [key, value] of Object.entries(data)) {
      body.append(key, JSON.stringify(value));
    }

    for (const [key, value] of Object.entries(files)) {
      body.append(key, value);
    }
  } else {
    body = JSON.stringify(data);
  }
  const response = await fetch(url, {
    method,
    headers: {
      ...!hasFiles && {
        'Content-Type': 'application/json'
      },
      ...headers
    },
    ...!isGet && {
      body
    }
  });

  if (response.status === 422) {
    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      // swallow
    }

    if (json) {
      throw json;
    }
  }

  if (!response.ok) {
    throw {
      message: 'response not okay',
      status: response.status
    };
  }

  try {
    const contentType = response.headers.get('Content-Type');
    if (contentType?.startsWith('application/json')) {
      return await response.json();
    } else {
      return await response.blob();
    }
  } catch {
    // swallow
  }
}
