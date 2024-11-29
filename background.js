let kepAliveIntervalId = null;

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.action === "genMindmap") {
        initKeepAliveTimer(sender.tab.id, request.action + "_update");
        sendResponse({ action: request.action + "_init" });

        let text = request.msg.substring(0, 50000);
        text = text.replace("\"", "''");

        let mindmapper = await ai.languageModel.create({
            systemPrompt: `You are mind map creator. ` +
                `return JSON text that represent the idea and sub ideas. follow this JSON format. all output must be in English.` +
                `each idea have a name (max 3 words) and description, idea can have childern array of ideas nodes (array name sub_ideas),` +
                `and sub_ideas can have its own childern array of ideas nodes (array name sub_ideas).use nesting as needed to explain more. `
        });

        let response = '';

        try {
            const mindmapPrompt = `Generate the JSON text ,Based on the following text: ${text}`;
            const mindmap = await mindmapper.prompt(`${mindmapPrompt}`);
            console.log(mindmap);

            response = mindmap;
        } catch (error) {
            console.log(error);
            await mindmapper.destroy();
            mindmapper = null;

            chrome.tabs.sendMessage(sender.tab.id, { action: request.action + "_err" });
        }

        if (kepAliveIntervalId) {
            clearInterval(kepAliveIntervalId);
        }

        chrome.tabs.sendMessage(sender.tab.id, {
            action: request.action + "_res",
            msg: response,
        });
    }
});

function initKeepAliveTimer(tabId, action) {
    if (kepAliveIntervalId) {
        clearInterval(kepAliveIntervalId);
    }

    kepAliveIntervalId = setInterval(() => {
        chrome.tabs.sendMessage(tabId, { action: action });
    }, 15000);
}
