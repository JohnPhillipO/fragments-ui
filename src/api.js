// src/api.js

// fragments microservice API, defaults to localhost:8080
const apiUrl = process.env.API_URL;

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
    return data;
  } catch (err) {
    console.error("Unable to call GET /v1/fragment", { err });
  }
}

async function getUserFragmentMetadata(fragment, user, type) {
  console.log("Requesting user fragment metadata...");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragment}/info`, {
      // Generate headers with the proper Authorization bearer token to pass
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    displayMetadataTable(data, type);
  } catch (err) {
    console.error(`Unable to call GET /v1/fragments/${fragment}/info`, {
      err,
    });
  }
}

async function getUserFragmentData(fragment, user) {
  console.log("Requesting user fragment data...");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragment}`, {
      // Generate headers with the proper Authorization bearer token to pass
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const fragmentData = document.getElementById("fragmentData");
    fragmentData.hidden = false;
    fragmentData.innerHTML = "";
    const contentType = res.headers.get("Content-Type");
    if (contentType.includes("text")) {
      const data = await res.text();
      fragmentData.innerHTML = data;
    } else if (contentType.includes("image")) {
      const data = await res.blob();
      const image = document.createElement("img");
      let objectURL = URL.createObjectURL(data);
      image.src = objectURL;
      fragmentData.appendChild(image);
    } else if (contentType.includes("json")) {
      const data = await res.json();
      const returnValue = JSON.stringify(data);
      fragmentData.innerHTML = returnValue;
    }
  } catch (err) {
    console.error(`Unable to call GET /v1/fragments/${fragment}`, { err });
  }
}

function displayMetadataTable(jsonData, type) {
  const isConverted = type ? true : false;
  const metadataBody = document.getElementById("metadataBody");

  // Clear existing table rows
  metadataBody.innerHTML = "";

  const metadataTable = document.getElementById("metadataTable");
  metadataTable.hidden = false;
  // Iterate through the JSON object and create table rows
  for (const property in jsonData.fragment) {
    if (Object.prototype.hasOwnProperty.call(jsonData.fragment, property)) {
      const row = document.createElement("tr");

      const propertyName = document.createElement("td");
      propertyName.textContent = property;

      const propertyValue = document.createElement("td");
      if (property == "type" && isConverted) {
        propertyValue.textContent = type;
      } else {
        propertyValue.textContent = jsonData.fragment[property];
      }

      row.appendChild(propertyName);
      row.appendChild(propertyValue);
      metadataBody.appendChild(row);
    }
  }
}

// Function to populate the fragment list:
// Option = string
export const populateFragmentList = (
  fragments,
  selectElement,
  option,
  user
) => {
  selectElement.innerHTML = ""; // Clear existing options
  // Clone the element to remove all event listeners
  const fragmentListClone = selectElement.cloneNode(true);
  selectElement.replaceWith(fragmentListClone);

  const optionPlaceholder = document.createElement("option");
  optionPlaceholder.value = "";
  optionPlaceholder.text = "Choose here";
  optionPlaceholder.selected = true;
  optionPlaceholder.disabled = true;
  optionPlaceholder.hidden = true;

  fragmentListClone.appendChild(optionPlaceholder);

  let count = 1;
  fragments.forEach((fragment) => {
    const optionFragment = document.createElement("option");
    optionFragment.value = `${count}`;
    optionFragment.text = fragment;
    fragmentListClone.appendChild(optionFragment);
    count++;
  });

  if (option === "delete") {
    fragmentListClone.addEventListener("change", function (event) {
      let selectedOption = event.target.value;
      // Get the selected fragment from the fragments array
      const selectedFragment = fragments[selectedOption - 1];
      const deleteBtn = document.querySelector("#deleteButton");
      const deleteAction = document.querySelector("#deleteAction");
      deleteAction.hidden = false;
      deleteBtn.onclick = () => {
        deleteUserFragment(selectedFragment, user);
      };
    });
  } else if (option === "view") {
    fragmentListClone.addEventListener("change", function (event) {
      let selectedOption = event.target.value;
      // Get the selected fragment from the fragments array
      const selectedFragment = fragments[selectedOption - 1];
      // Call getUserFragmentMetadata with user and selectedFragment
      getUserFragmentMetadata(selectedFragment, user, "");
      // Call getUserFragmentData to get the data
      getUserFragmentData(selectedFragment, user);

      const convertFragmentSection = document.querySelector("#convertFragment");
      convertFragmentSection.hidden = false;

      // Clone the element to remove all event listeners
      const convertTypeList = document.querySelector("#convertTypeList");
      convertTypeList.innerHTML = ""; // Clear existing convertTypeList options
      const convertListClone = convertTypeList.cloneNode(true);
      convertTypeList.replaceWith(convertListClone);

      const optionPlaceholder = document.createElement("option");
      optionPlaceholder.value = "";
      optionPlaceholder.text = "Choose type here";
      optionPlaceholder.selected = true;
      optionPlaceholder.disabled = true;
      optionPlaceholder.hidden = true;

      convertListClone.appendChild(optionPlaceholder);
      // Get fragment contentType
      // Based on the contentType populate the convert type list with valid conversions
      // Implement on on click with the convertTypeList
      // initConvert(selectFragment, convertTypeList, user)
      initConvert(selectedFragment, convertListClone, user);
    });
  } else if (option === "update") {
    fragmentListClone.addEventListener("change", function (event) {
      let selectedOption = event.target.value;
      // Get the selected fragment from the fragments array
      const selectedFragment = fragments[selectedOption - 1];
      initUpdateAction(selectedFragment, user);
    });
  }
};

async function initConvert(id, convertTypeList, user) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      // Generate headers with the proper Authorization bearer token to pass
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const type = res.headers.get("Content-Type");
    const imageFormats = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    const textFormats = {
      "text/plain": ["text/plain"],
      "text/markdown": ["text/plain", "text/html", "text/markdown"],
      "text/html": ["text/plain", "text/html"],
      "application/json": ["application/json", "text/plain"],
    };
    let count = 1;
    if (type.startsWith("text/") || type.startsWith("application/")) {
      const validTextFormats = textFormats[type];
      if (validTextFormats) {
        for (const format of validTextFormats) {
          const optionType = document.createElement("option");
          optionType.value = `${count}`;
          optionType.text = format;
          convertTypeList.appendChild(optionType);
          count++;
        }
      }
    }
    if (type.startsWith("image/")) {
      for (let image of imageFormats) {
        const optionType = document.createElement("option");
        optionType.value = `${count}`;
        optionType.text = image;
        convertTypeList.appendChild(optionType);
        count++;
      }
    }
    convertTypeList.addEventListener("change", function () {
      const selectedContentType =
        convertTypeList.options[convertTypeList.selectedIndex].textContent;
      const extensions = {
        "text/plain": ".txt",
        "text/markdown": ".md",
        "text/html": ".html",
        "application/json": ".json",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "image/gif": ".gif",
      };
      const ext = extensions[selectedContentType];
      // Convert Fragment Function:
      // convertUserFragment(id, ext, user);
      convertUserFragment(id, ext, user);
    });
  } catch (err) {
    console.error(`Unable to GET fragment via ${apiUrl}/v1/fragments/${id}`, {
      err,
    });
  }
}

async function convertUserFragment(id, ext, user) {
  console.log("Converting Fragment");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}${ext}`, {
      // Generate headers with the proper Authorization bearer token to pass
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    // Clear Data
    const fragmentData = document.getElementById("fragmentData");
    fragmentData.hidden = false;
    fragmentData.innerHTML = "";
    // Populate Data:
    const contentType = res.headers.get("Content-Type");
    if (contentType.includes("text")) {
      const data = await res.text();
      fragmentData.innerHTML = data;
    } else if (contentType.includes("image")) {
      const data = await res.blob();
      const image = document.createElement("img");
      let objectURL = URL.createObjectURL(data);
      image.src = objectURL;
      fragmentData.appendChild(image);
    } else if (contentType.includes("json")) {
      const data = await res.json();
      const returnValue = JSON.stringify(data);
      fragmentData.innerHTML = returnValue;
    }
    getUserFragmentMetadata(id, user, res.headers.get("Content-Type"));
  } catch (err) {
    console.error(
      `Unable to GET fragment via ${apiUrl}/v1/fragments/${id}.${ext}`,
      {
        err,
      }
    );
  }
}

async function initUpdateAction(id, user) {
  console.log("GET fragments data for UPDATE");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      // Generate headers with the proper Authorization bearer token to pass
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const updateBtn = document.querySelector("#updateBtn");
    const updateAction = document.querySelector("#updateAction");
    const updateText = document.querySelector("#updateText");
    const updateImage = document.querySelector("#updateImage");
    const contentType = res.headers.get("Content-Type");

    // Reset:
    const updateSuccess = document.querySelector("#updateSuccess");
    updateSuccess.innerHTML = "";
    const updateMessage = document.querySelector("#newMessage");
    const data = await res.text();
    updateMessage.value = data;
    updateText.hidden = true;
    // Create a new file input element
    const newInput = document.createElement("input");
    newInput.type = "file";
    newInput.id = "newMessageFile";
    // Get the existing file input element
    const existingInput = document.getElementById("newMessageFile");
    // Replace the existing input with the new one
    existingInput.parentNode.replaceChild(newInput, existingInput);
    updateImage.hidden = true;

    if (
      contentType.startsWith("text/") ||
      contentType.startsWith("application/")
    ) {
      updateAction.hidden = false;
      updateText.hidden = false;
      if (updateMessage.value != "") {
        updateBtn.disabled = false;
      } else {
        updateBtn.disabled = true;
      }
    } else if (contentType.startsWith("image/")) {
      updateAction.hidden = false;
      updateImage.hidden = false;
      updateBtn.disabled = true;
    }

    updateBtn.onclick = () => {
      if (
        contentType.startsWith("text/") ||
        contentType.startsWith("application/")
      ) {
        const message = updateMessage.value;
        updateUserFragment(message, id, contentType, user);
        updateMessage.value = "";
      } else if (contentType.startsWith("image/")) {
        const data = document.querySelector("#newMessageFile").files[0];
        if (contentType != data.type) {
          console.log("TEST !@#");
          alert(
            `MUST BE SAME TYPE: You sent a type of ${data.type} while the fragments content type is ${contentType}`
          );
          return;
        }
        updateUserFragment(data, id, contentType, user);
      }
    };

    updateMessage.addEventListener("change", function (event) {
      if (event.target.value == "") {
        updateBtn.disabled = true;
      } else {
        updateBtn.disabled = false;
      }
    });

    newInput.addEventListener("change", function (event) {
      const data = event.target.value;
      if (data != null) {
        updateBtn.disabled = false;
      } else {
        updateBtn.disabled = false;
      }
    });
  } catch (err) {
    console.error("Unable to GET fragment for UPDATE", { err });
  }
}

async function updateUserFragment(data, id, type, user) {
  const updateSuccess = document.querySelector("#updateSuccess");
  console.log("Updating a user fragment");
  try {
    let requestBody = data ? data : "";
    if (type == "application/json") {
      requestBody = JSON.parse(JSON.stringify(data));
    }
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: "PUT",
      headers: {
        ...user.authorizationHeaders(),
        "Content-Type": type,
      },
      body: requestBody,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const updateAction = document.querySelector("#updateAction");
    updateAction.hidden = true;

    // Repopulate fragment list after successful deletion
    const fragmentUpdateList = document.querySelector("#fragmentListUpdate");
    getUserFragments(user, false)
      .then((data) => {
        populateFragmentList(
          data.fragments,
          fragmentUpdateList,
          "update",
          user
        );
      })
      .catch((err) => console.error(err));
    console.log("Update fragment: ", data);
    console.log(res);
    updateSuccess.innerHTML =
      'Updated Fragment. (Click on "Get User Fragment" to view)';
  } catch (err) {
    console.error("Unable to update fragment", { err });
  }
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
    let requestBody = message ? message : ""; // set the message as the request body
    if (contentType == "application/json") {
      requestBody = JSON.parse(JSON.stringify(message));
    }
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: "POST",
      headers: {
        ...user.authorizationHeaders(),
        "Content-Type": contentType,
      },
      body: requestBody,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    console.log("Posted fragment: ", message);
    console.log(res);
    successMessage.innerHTML =
      'Created Fragment. (Click on "Get User Fragment" to view)';
  } catch (err) {
    console.error("Unable to create fragment", { err });
  }
}

async function deleteUserFragment(id, user) {
  console.log(`Deleting ${id}`);
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: "DELETE",
      headers: {
        ...user.authorizationHeaders(),
      },
    });

    console.log("Deleted Fragment!");

    const deleteAction = document.querySelector("#deleteAction");
    deleteAction.hidden = true;

    // Repopulate fragment list after successful deletion
    const fragmentDeleteList = document.querySelector("#fragmentListDelete");
    getUserFragments(user, false)
      .then((data) => {
        populateFragmentList(
          data.fragments,
          fragmentDeleteList,
          "delete",
          user
        );
      })
      .catch((err) => console.error(err));

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error("Unable to delete fragment", { err });
  }
}
