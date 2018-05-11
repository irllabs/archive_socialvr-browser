import { MIME_TYPE_TEXT } from 'ui/common/constants';

const COPY = 'copy';

// https://gist.github.com/lgarron/d1dee380f4ed9d825ca7
function copyToClipboard(stringToCopy: string) {
  return new Promise((resolve, reject) => {
    document.addEventListener(COPY, (event) => {
      try {
        (<any>event).clipboardData.setData(MIME_TYPE_TEXT, stringToCopy);
        event.preventDefault();
        resolve(stringToCopy);
      }
      catch (error) {
        reject(error);
      }
    });
    document.execCommand(COPY);
  });
}

export {
  copyToClipboard,
};
