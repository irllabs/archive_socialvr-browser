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
      data: decodedParam
    };
  }
  catch(error) {
    return {
      message: 'ERROR',
      data: error
    };
  }
}

function decodeMultviewParam(encodedString: string) {
  try {
    const base64Param = decodeURIComponent(encodedString);
    const decodedParam = atob(base64Param);
    const [userId, projectId] = decodedParam.split('-');
    if (userId === undefined || projectId === undefined) {
      throw new Error(`Malformed value: ${userId} ${projectId}`);
    }
    return {
      ok: true,
      data: { userId, projectId }
    };
  }
  catch(error) {
    return {
      ok: false,
      data: error
    };
  }
}

function getShareableLink(publicProjectUrl: string) {
  const baseUrl = `${location.protocol}//${location.host}`;
  const pathName = location.pathname;
  const queryIndex = location.hash.indexOf('?') < 0 ? location.hash.length : location.hash.indexOf('?');
  const hash = location.hash.substring(0, queryIndex)
  const queryParams= `${SHARED_KEY}=${encodeParam(publicProjectUrl)}`;
  return `${baseUrl}${pathName}${hash}?${queryParams}`;
}

function getMultiViewLink(userId: string, projectId: string): string {
  const baseUrl = `${location.protocol}//${location.host}`;
  const multiviewValue = encodeURIComponent(btoa(`${userId}-${projectId}`));
  const path = `#/editor/(view:preview)?multiview=${multiviewValue}`;
  return `${baseUrl}${path}`;
}

export {
  SHARED_KEY,
  getShareableLink,
  getMultiViewLink,
  decodeParam,
  decodeMultviewParam
};
