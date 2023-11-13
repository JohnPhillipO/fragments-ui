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
    await displayFragments(data.fragments, user);
  } catch (err) {
    console.error("Unable to call GET /v1/fragment", { err });
  }
}

async function getUserFragment(user, fragment) {
  const metadata = document.querySelector("#metadata");
  console.log("Requesting user fragments data...");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragment}/info`, {
      // Generate headers with the proper Authorization bearer token to pass
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    metadata.textContent = JSON.stringify(data);
    console.log("Got user fragments data", { data });
  } catch (err) {
    console.error(`Unable to call GET /v1/fragments/${fragment}/info`, { err });
  }
}

async function displayFragments(fragments, user) {
  const fragmentList = document.querySelector("#fragmentList");

  // Clear the existing list
  fragmentList.innerHTML = "";

  // Create a list item for each fragment and append it to the fragment list
  fragments.forEach((fragment) => {
    const listItem = document.createElement("button");
    listItem.textContent = fragment;
    listItem.style.marginBottom = "10px";
    listItem.onclick = () => {
      getUserFragment(user, fragment);
    };
    fragmentList.appendChild(listItem);
  });
}

export async function createUserFragment(message, contentType) {
  const successMessage = document.querySelector("#successMsg");
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
        "Content-Type": contentType, // Set the content type to 'text/plain'
      },
      body: requestBody,
    });
    successMessage.innerHTML =
      'Created Fragment. (Click on "Get User Fragment" to view)';
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error("Unable to create fragment", { err });
  }
}
