export const NAVPrefix = '##!!';

export function navgateTo(path: string) {
    try {
        history.replaceState(null, '', `/${NAVPrefix}/${path}`);
    } catch (err) {
        console.log('navgateTo error (ok to ignore)', err);
    }
}