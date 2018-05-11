const SHARED_KEY = 'sharedproject';

function encodeParam(publicProjectUrl: string) {
  const base64Params = btoa(publicProjectUrl);

  return encodeURIComponent(base64Params);
}

function decodeParam(encodedParam: string) {
  try {
    const base64Param = decodeURIComponent(encodedParam);
    const decodedParam = atob(base64Param);

    return {
      message: 'OK',
      data: decodedParam,
    };
  } catch (error) {
    return {
      message: 'ERROR',
      data: error,
    };
  }
}

function getShareableLink(publicProjectUrl: string) {
  const baseUrl = `${location.protocol}//${location.host}`;
  const pathName = location.pathname;
  const hash = '#/editor/(view:flat)';
  const queryParams = `${SHARED_KEY}=${encodeParam(publicProjectUrl)}`;

  return `${baseUrl}${pathName}${hash}?${queryParams}`;
}

export {
  SHARED_KEY,
  getShareableLink,
  decodeParam,
};
