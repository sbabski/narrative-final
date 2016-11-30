var chat = null;

function openChat() {
    setTimeout(function() {
        if(!chat) {
            console.log('testing');
        }
        var chat = window.open('/chat', 'Chat', 'width=400, height=400');
        if(chat) {
            if(chat.closed == false) {
                chat.close();
            }
            window.open('/chat', 'Chat', 'width=400, height=400');
        } else {
            console.log('blocked');
        }
    }, 3000);
}