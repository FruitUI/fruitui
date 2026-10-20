// The example website's own script: signing in and out, which a real website does on its server.
// Signed in, the website passes a token its server signed (a stand-in here) to the chat.
const signIn = document.querySelector('[data-sign-in]');
const signedIn = document.querySelector('[data-signed-in]');
const signOut = document.querySelector('[data-sign-out]');

signIn.addEventListener('click', () => {
  signIn.hidden = true;
  signedIn.hidden = false;
  signOut.focus();
  window.tallport('identify', 'signed-by-forma.example-for-lena');
});

signOut.addEventListener('click', () => {
  signedIn.hidden = true;
  signIn.hidden = false;
  signIn.focus();
  window.tallport('logout');
});

// With the chat's script loaded and taking chats, "Chat with us" opens it in the corner instead of on
// its own page.
for (const link of document.querySelectorAll('[data-chat]'))
  link.addEventListener('click', event => {
    if (!window.tallport?.available) return;
    event.preventDefault();
    window.tallport('open');
  });
