var chat = null;

function openChatDelay() {
    setTimeout(openChat, 3000);
}

function openChat() {
    if(!chat) {
        chat = window.open('/chat', 'Chat', 'width=400, height=400');
    }
    if(chat) {
        if(chat.closed == false) {
            chat.close();
        }
        window.open('/chat', 'Chat', 'width=400, height=400');
    } else {
        console.log('blocked');
    }
}