var chat = null;

function openChat() {
    setTimeout(function() {
        if(!chat) {
            chat = window.open('/chat', 'Chat', 'width=400, height=400');
        }
        if(!chat) {
            console.log('blocked');
        } else {
            console.log('chat is here');
        }
        /*if(chat) {
            if(chat.closed == false) {
                chat.close();
            }
            window.open('/chat', 'Chat', 'width=400, height=400');
        } else {
            console.log('blocked');
        }*/
    }, 3000);
}