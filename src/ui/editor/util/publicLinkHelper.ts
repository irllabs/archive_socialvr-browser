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

function getShareableLink(publicProjectUrl: string) {
  const baseUrl = `${location.protocol}//${location.host}`;
   console.log(location);
  const pathName = location.pathname;
  const queryIndex = location.hash.indexOf('?') < 0 ? location.hash.length : location.hash.indexOf('?');
  //const hash = location.hash.substring(0, queryIndex);
  const hash = `#/editor/(view:flat)`;
  const queryParams= `${SHARED_KEY}=${encodeParam(publicProjectUrl)}`;
  console.log('pathName:',queryParams);
  //console.log('pathName:',getShareableLink);
  console.log('hash:',hash);
  return `${baseUrl}${pathName}${hash}?${queryParams}`;
}

export {
  SHARED_KEY,
  getShareableLink,
  decodeParam
};
