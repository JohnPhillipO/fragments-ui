// src/api.js

// fragments microservice API, defaults to localhost:8080
const apiUrl = process.env.API_URL || "http://localhost:8080";

import { getUser } from "./auth";

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
export async function getUserFragments(user) {
  console.log("Requesting user fragments data...");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      // Generate headers with the proper Authorization bearer token to pass
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log("Got user fragments data", { data });

    // Update the UI to display the fragments
    await displayFragments(data.fragments);
  } catch (err) {
    console.error("Unable to call GET /v1/fragment", { err });
  }
}

async function displayFragments(fragments) {
  const fragmentList = document.querySelector("#fragmentList");

  // Clear the existing list
  fragmentList.innerHTML = "";

  // Create a list item for each fragment and append it to the fragment list
  fragments.forEach((fragment) => {
    const listItem = document.createElement("li");
    listItem.textContent = fragment;
    fragmentList.appendChild(listItem);
  });
}

export async function createUserFragment(message) {
  console.log("Creating a user fragment");
  try {
    const user = await getUser();
    if (!user) {
      console.error("User is not authenticated.");
      return;
    }

    const requestBody = message ? message : ""; // Set the message as the request body

    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: "POST",
      headers: {
        ...user.authorizationHeaders(),
        "Content-Type": "text/plain", // Set the content type to 'text/plain'
      },
      body: requestBody,
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    //const data = await res.json();
    //console.log("Got user fragments data", { data });
    getUserFragments(user);
  } catch (err) {
    console.error("Unable to create fragment", { err });
  }
}
