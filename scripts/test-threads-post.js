#!/usr/bin/env node
/**
 * Test post to Threads using existing access token
 */

const ACCESS_TOKEN = "EAALrgwWehcsBQzIQUK9mtu2dgPejeIXpoTBK6W04wJNQDHdQZB8aZB6WodOfs5miNPoxSJc3sJWLbLWEznZBGHZBz2AZBtJixSVZCOwyL62cFoZCFHWpkZAJzXMARQcmxsZCNIdQEAZCmik0s87IwIDL2d6NRTjVNJmbgMErxbt43Hvx57CK0iPETj8NAJZBZCYXiAZDZD";

const postContent = "testing my new automation platform!!! 🧵\n\nif this posts, it means my AI agents are working!!!";

async function postToThreads() {
  console.log("🧵 Posting to Threads...\n");
  console.log("Content:", postContent);
  console.log("");

  try {
    // Step 1: Create a single post container
    console.log("Step 1: Creating post container...");
    const createResponse = await fetch("https://graph.threads.net/v1.0/me/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        media_type: "TEXT",
        text: postContent,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error("❌ Failed to create container:", error);
      process.exit(1);
    }

    const creationData = await createResponse.json();
    console.log("✅ Container created:", creationData.id);

    // Step 2: Publish the container
    console.log("\nStep 2: Publishing post...");
    const publishResponse = await fetch("https://graph.threads.net/v1.0/me/threads_publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        creation_id: creationData.id,
      }),
    });

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      console.error("❌ Failed to publish:", error);
      process.exit(1);
    }

    const publishData = await publishResponse.json();
    console.log("✅ Post published successfully!");
    console.log("\nPost ID:", publishData.id);
    console.log("Post URL:", `https://threads.net/@${publishData.username}/post/${publishData.id}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

postToThreads();
