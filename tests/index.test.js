const axios2 = require("axios");
const WebSocket = require("ws");

const BACKEND_URL = "http://localhost:3000"
const WS_URL = "ws://localhost:3001"

//(...args): This is the rest parameter syntax. It allows the function to accept an indefinite number of arguments as an array
//  When you call post('url', { data: 'payload' }, { headers: {} }), args will be ['url', { data: 'payload' }, { headers: {} }]
const axios = {
    post: async (...args) => {
        try {
            const res = await axios2.post(...args)
            return res
        } catch(e) {
            return e.response
        }
    },
    get: async (...args) => {
        try {
            const res = await axios2.get(...args)
            return res
        } catch(e) {
            return e.response
        }
    },
    put: async (...args) => {
        try {
            const res = await axios2.put(...args)
            return res
        } catch(e) {
            return e.response
        }
    },
    delete: async (...args) => {
        try {
            const res = await axios2.delete(...args)
            return res
        } catch(e) {
            return e.response
        }
    },
}

describe("Authentication", () => {
    //ek user jb phli baar request krega to vo succesfully register ho jaega another attemp with the same username will be rejected with code 400
    test('User is able to sign up only once', async () => {
        const username = "kirat" + Math.random() + Date.now(); // ensure uniqueness
        const password = "123456";
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })

        expect(response.status).toBe(200)
        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })

        expect(updatedResponse.status).toBe(400);
    });

    test('Signup request fails if the username is empty', async () => {
        const username = `kirat-${Math.random()}` // kirat-0.12312313
        const password = "123456"

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            password
        })

        expect(response.status).toBe(400)
    })

    test('Signin succeeds if the username and password are correct', async() => {
        const username = `kirat-${Math.random()}`
        const password = "123456"

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        });

        expect(response.status).toBe(200)
        // expect(response.data.token).toBeDefined() menans value undefined nii honi chahiye
        expect(response.data.token).toBeDefined()
        
    })

    test('Signin fails if the username and password are incorrect', async() => {
        const username = `kirat-${Math.random()}`
        const password = "123456"

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: "WrongUsername",
            password
        })

        expect(response.status).toBe(403)
    })
})

describe("User metadata endpoint", () => {
    let token = "";
    let avatarId = ""

    beforeAll(async () => {
       const username = `kirat-${Math.random()}`
       const password = "123456"

       await axios.post(`${BACKEND_URL}/api/v1/signup`, {
        username,
        password,
        type: "admin"
       });

       const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
        username,
        password
       })

       token = response.data.token

       const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                authorization: `Bearer ${token}`
            }
        })
        // console.log("avatarresponse is " + avatarResponse.data.avatarId)

        avatarId = avatarResponse.data.avatarId;

    })

    test("User cannot update their metadata with a wrong avatar id", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: "123123123"
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        expect(response.status).toBe(400)
    })

    test("User can update their metadata with the right avatar id", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        expect(response.status).toBe(200)
    })

    test("User is not able to update their metadata if the auth header is not present", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        })

        expect(response.status).toBe(403)
    })

    test("User can update their metadata with the right avatar id if Name is not present ", async() => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        expect(response.status).toBe(200)
        
    })
});

describe("User avatar information", () => {
    let avatarId;
    let token;
    let userId;

    beforeAll(async () => {
        const username = `kirat-${Math.random()}`
        const password = "123456"
 
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
         username,
         password,
         type: "admin"
        });

        userId = signupResponse.data.userId
 
        // console.log("userid is " + userId)
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
         username,
         password
        })
 
        token = response.data.token
 
        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
             "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
             "name": "Timmy"
         }, {
            headers: {
                authorization: `Bearer ${token}`
            }
         })
 
         avatarId = avatarResponse.data.avatarId;
 
    })

    test("Get back avatar information for a user", async () => {
        // console.log("asking for user with id " + userId)
        const response = await axios.get(`${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`);
        // console.log("response was " + userId)
        // console.log(JSON.stringify(response.data))
        expect(response.data.avatars.length).toBe(1);
        expect(response.data.avatars[0].userId).toBe(userId);
    })

    test("Available avatars lists the recently created avatar", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/avatars`);
        expect(response.data.avatars.length).not.toBe(0);
        const currentAvatar = response.data.avatars.find(x => x.id == avatarId);
        expect(currentAvatar).toBeDefined()
    })

})

describe("Space information", () => {
    let mapId;
    let element1Id;
    let element2Id;
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        const username = `kirat-${Math.random()}`
        const password = "123456"
 
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
         username,
         password,
         type: "admin"
        });

        adminId = signupResponse.data.userId
 
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
         username,
         password
        })
 
        adminToken = response.data.token

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username + "-user",
            password,
            type: "user"
        });
   
        userId = userSignupResponse.data.userId
    
        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-user",
            password
        })
    
        userToken = userSigninResponse.data.token
        //ek elemnt add kra hai
        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        element1Id = element1Response.data.id
        element2Id = element2Response.data.id
        // console.log(element2Id)
        // console.log(element1Id)
        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "Test space",
            "defaultElements": [{
                    elementId: element1Id,
                    x: 20,
                    y: 20
                }, {
                  elementId: element1Id,
                    x: 18,
                    y: 20
                }, {
                  elementId: element2Id,
                    x: 19,
                    y: 20
                }
            ]
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
         })
        //  console.log(mapResponse.data.id)

         mapId = mapResponse.data.id

    },25000);

    test("User is able to create a space", async () => {

        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
          "name": "Test",
          "dimensions": "100x200",
          "mapId": mapId
       }, {
        headers: {
            authorization: `Bearer ${userToken}`
        }
       })
       expect(response.status).toBe(200)
       expect(response.data.spaceId).toBeDefined()
    })

    test("User is able to create a space without mapId (empty space)", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
          "name": "Test",
          "dimensions": "100x200",
       }, {
        headers: {
            authorization: `Bearer ${userToken}`
        }
       })

       expect(response.data.spaceId).toBeDefined()
    })

    test("User is not able to create a space without mapId and dimensions", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
          "name": "Test",
       }, {
        headers: {
            authorization: `Bearer ${userToken}`
        }
       })

       expect(response.status).toBe(400)
    })

    test("User is not able to delete a space that doesnt exist", async () => {
        const response = await axios.delete(`${BACKEND_URL}/api/v1/space/randomIdDoesntExist`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

       expect(response.status).toBe(400)
    })

    test("User is able to delete a space that does exist", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const deleteReponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

       expect(deleteReponse.status).toBe(200)
    })

    test("User should not be able to delete a space created by another user", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const deleteReponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

       expect(deleteReponse.status).toBe(403)
    })

    test("Admin has no spaces initially", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        expect(response.data.spaces.length).toBe(0)
    })

    test("Admin has gets once space after", async () => {
        const spaceCreateReponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        // console.log(spaceCreateReponse.data)
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        const filteredSpace = response.data.spaces.find(x => x.id == spaceCreateReponse.data.spaceId)
        expect(response.data.spaces.length).toBe(1)
        expect(filteredSpace).toBeDefined()

    })
})

describe("Arena endpoints", () => {
  let mapId;
  let element1Id;
  let element2Id;
  let adminToken;
  let adminId;
  let userToken;
  let userId;
  let spaceId;

  beforeAll(async () => {
    const username = `kirat-${Math.random()}`;
    const password = "123456";

    const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    adminId = signupResponse.data.userId;

    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: username,
      password,
    });

    adminToken = response.data.token;

    const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username: username + "-user",
      password,
      type: "user",
    });

    userId = userSignupResponse.data.userId;

    const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: username + "-user",
      password,
    });

    userToken = userSigninResponse.data.token;

    const element1Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const element2Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = element1Response.data.id;
    element2Id = element2Response.data.id;

    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "Default space",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 20,
          },
          {
            elementId: element1Id,
            x: 18,
            y: 20,
          },
          {
            elementId: element2Id,
            x: 19,
            y: 20,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapResponse.data.id;

    const spaceResponse = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId: mapId,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    // console.log(spaceResponse.data);
    spaceId = spaceResponse.data.spaceId;
  }, 15000); // Increased timeout to 15 seconds

  test("Incorrect spaceId returns a 400", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/123kasdk01`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    expect(response.status).toBe(400);
  });

  test("Correct spaceId returns all the elements", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    // console.log(response.data);
    expect(response.data.dimensions).toBe("100x200");
    expect(response.data.elements.length).toBe(3);
  });

  test("Delete endpoint is able to delete an element", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    // console.log(response.data.elements[0].id);
    let res = await axios.delete(`${BACKEND_URL}/api/v1/space/element`, {
      data: { id: response.data.elements[0].id },
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    const newResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    expect(newResponse.data.elements.length).toBe(2);//phle 3 thi ek delete ki to 2 bachi
  });

  test("Adding an element fails if the element lies outside the dimensions", async () => {
    const newResponse = await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        elementId: element1Id,
        spaceId: spaceId,
        x: 10000,
        y: 210000,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    expect(newResponse.status).toBe(400);
  });

  test("Adding an element works as expected", async () => {
    await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        elementId: element1Id,
        spaceId: spaceId,
        x: 50,
        y: 20,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    const newResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    expect(newResponse.data.elements.length).toBe(3);
  });
});

describe("Admin Endpoints", () => {
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        const username = `kirat-${Math.random()}`
        const password = "123456"
 
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
         username,
         password,
         type: "admin"
        });

        adminId = signupResponse.data.userId
 
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
         username: username,
         password
        })
 
        adminToken = response.data.token

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username + "-user",
            password,
            type: "user"
        });
   
        userId = userSignupResponse.data.userId
    
        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username  + "-user",
            password
        })
    
        userToken = userSigninResponse.data.token
    });

    test("User is not able to hit admin Endpoints", async () => {
        const elementReponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "test space",
            "defaultElements": []
         }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })

        const updateElementResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/123`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(elementReponse.status).toBe(403)
        expect(mapResponse.status).toBe(403)
        expect(avatarResponse.status).toBe(403)
        expect(updateElementResponse.status).toBe(403)
    })

    test("Admin is able to hit admin Endpoints", async () => {
        const elementReponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "name": "Space",
            "dimensions": "100x200",
            "defaultElements": []
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        })
        expect(elementReponse.status).toBe(200)
        expect(mapResponse.status).toBe(200)
        expect(avatarResponse.status).toBe(200)
    })
 
    test("Admin is able to update the imageUrl for an element", async () => {
        const elementResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const updateElementResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/${elementResponse.data.id}`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        })

        expect(updateElementResponse.status).toBe(200);

    })
});


describe("Websocket tests – movement, chat, security", () => {
    let adminToken;
    let adminUserId;
    let userToken;
    let userId;
    let spaceId;
    let ws1;
    let ws2;
    const ws1Messages = []
    const ws2Messages = []
    let adminX;
    let adminY;

    function waitForMessageOfType(messageArray, type, timeoutMs = 10000) {
        return new Promise((resolve, reject) => {
            const deadline = Date.now() + timeoutMs;
            const interval = setInterval(() => {
                const idx = messageArray.findIndex(m => m.type === type);
                if (idx !== -1) {
                    clearInterval(interval);
                    resolve(messageArray.splice(idx, 1)[0]);
                } else if (Date.now() > deadline) {
                    clearInterval(interval);
                    reject(new Error(`Timed out waiting for "${type}". Queue: ${JSON.stringify(messageArray)}`));
                }
            }, 100);
        });
    }

    beforeAll(async () => {
        const username = `kirat-${Math.random()}`
        const password = "123456"

        const adminSignup = await axios.post(`${BACKEND_URL}/api/v1/signup`, { username, password, type: "admin" })
        const adminSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, { username, password })
        adminUserId = adminSignup.data.userId
        adminToken = adminSignin.data.token

        const userSignup = await axios.post(`${BACKEND_URL}/api/v1/signup`, { username: username + "-u", password, type: "user" })
        const userSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, { username: username + "-u", password })
        userId = userSignup.data.userId
        userToken = userSignin.data.token

        const el1 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:test1", width: 1, height: 1, static: true
        }, { headers: { authorization: `Bearer ${adminToken}` } })

        const el2 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:test2", width: 1, height: 1, static: true
        }, { headers: { authorization: `Bearer ${adminToken}` } })

        const map = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            thumbnail: "https://thumbnail.com/a.png",
            dimensions: "100x200",
            name: "WS Test Space",
            defaultElements: [
                { elementId: el1.data.id, x: 20, y: 20 },
                { elementId: el1.data.id, x: 18, y: 20 },
                { elementId: el2.data.id, x: 19, y: 20 }
            ]
        }, { headers: { authorization: `Bearer ${adminToken}` } })

        const space = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "WS Test Space", dimensions: "100x200", mapId: map.data.id
        }, { headers: { authorization: `Bearer ${userToken}` } })
        spaceId = space.data.spaceId

        ws1 = new WebSocket(WS_URL)
        ws1.onmessage = e => ws1Messages.push(JSON.parse(e.data))
        await new Promise(r => ws1.onopen = r)

        ws2 = new WebSocket(WS_URL)
        ws2.onmessage = e => ws2Messages.push(JSON.parse(e.data))
        await new Promise(r => ws2.onopen = r)

        // ws1 (admin) joins
        ws1.send(JSON.stringify({ type: "join", payload: { spaceId, token: adminToken } }))
        const joined1 = await waitForMessageOfType(ws1Messages, "space-joined")
        await waitForMessageOfType(ws1Messages, "chat-history")
        adminX = joined1.payload.spawn.x
        adminY = joined1.payload.spawn.y

        // ws2 (user) joins
        ws2.send(JSON.stringify({ type: "join", payload: { spaceId, token: userToken } }))
        await waitForMessageOfType(ws2Messages, "space-joined")
        await waitForMessageOfType(ws2Messages, "chat-history")
        await waitForMessageOfType(ws1Messages, "user-joined")
    }, 40000)

    afterAll(() => {
        if (ws1 && ws1.readyState !== ws1.CLOSED) ws1.close()
        if (ws2 && ws2.readyState !== ws2.CLOSED) ws2.close()
    })

    // ── Original join / movement tests ─────────────────────
    test("Get back ack for joining the space", () => {
        // join already verified in beforeAll; confirm spawn coords were captured
        expect(adminX).toBeDefined()
        expect(adminY).toBeDefined()
    })

    test("User should not be able to move across the boundary of the wall", async () => {
        ws1.send(JSON.stringify({ type: "movement", payload: { x: 1000000, y: 10000 } }))
        const msg = await waitForMessageOfType(ws1Messages, "movement-rejected")
        expect(msg.payload.x).toBe(adminX)
        expect(msg.payload.y).toBe(adminY)
    })

    test("User should not be able to move two blocks at the same time", async () => {
        ws1.send(JSON.stringify({ type: "movement", payload: { x: adminX + 2, y: adminY } }))
        const msg = await waitForMessageOfType(ws1Messages, "movement-rejected")
        expect(msg.payload.x).toBe(adminX)
        expect(msg.payload.y).toBe(adminY)
    })

    test("Correct movement is broadcasted to other sockets in the room", async () => {
        ws1.send(JSON.stringify({ type: "movement", payload: { x: adminX + 1, y: adminY } }))
        const msg = await waitForMessageOfType(ws2Messages, "movement")
        expect(msg.payload.x).toBe(adminX + 1)
        expect(msg.payload.y).toBe(adminY)
        adminX = adminX + 1 // keep in sync for subsequent tests
    })

    // ── Security tests ─────────────────────────────────────
    test("Joining with an invalid token closes the connection", async () => {
        const badWs = new WebSocket(WS_URL)
        let closed = false
        await new Promise(r => badWs.onopen = r)
        badWs.onclose = () => { closed = true }
        badWs.send(JSON.stringify({ type: "join", payload: { spaceId, token: "bad.token.xyz" } }))
        await new Promise(r => setTimeout(r, 1500))
        expect(closed).toBe(true)
    })

    test("Joining a non-existent space closes the connection", async () => {
        const badWs = new WebSocket(WS_URL)
        let closed = false
        await new Promise(r => badWs.onopen = r)
        badWs.onclose = () => { closed = true }
        badWs.send(JSON.stringify({ type: "join", payload: { spaceId: "nonexistent-xyz-space-999", token: adminToken } }))
        await new Promise(resolve => {
            const deadline = Date.now() + 8000
            const iv = setInterval(() => {
                if (closed || Date.now() > deadline) { clearInterval(iv); resolve() }
            }, 100)
        })
        expect(closed).toBe(true)
    }, 15000)

    // ── Chat / realtime tests ───────────────────────────────
    test("Chat message sent by one user is received by others in the room", async () => {
        ws1.send(JSON.stringify({ type: "chat-message", payload: { message: "hello from admin" } }))
        const msg = await waitForMessageOfType(ws2Messages, "chat-message")
        expect(msg.payload.message).toBe("hello from admin")
        expect(msg.payload.userId).toBe(adminUserId)
    })

    test("Chat message payload includes userId, username and timestamp", async () => {
        ws2.send(JSON.stringify({ type: "chat-message", payload: { message: "hello from user" } }))
        const msg = await waitForMessageOfType(ws1Messages, "chat-message")
        expect(msg.payload.userId).toBeDefined()
        expect(msg.payload.username).toBeDefined()
        expect(msg.payload.timestamp).toBeDefined()
    })

    test("Typing indicator is broadcast to other users", async () => {
        ws1.send(JSON.stringify({ type: "typing", payload: { userId: adminUserId } }))
        const msg = await waitForMessageOfType(ws2Messages, "typing")
        expect(msg.payload.userId).toBe(adminUserId)
    })

    test("Emoji reaction is broadcast to other users", async () => {
        ws1.send(JSON.stringify({ type: "emoji-reaction", payload: { emoji: "👍" } }))
        const msg = await waitForMessageOfType(ws2Messages, "emoji-reaction")
        expect(msg.payload.emoji).toBe("👍")
        expect(msg.payload.userId).toBe(adminUserId)
    })

    test("User outside the space does not receive messages from inside", async () => {
        const outsiderWs = new WebSocket(WS_URL)
        const outsiderMessages = []
        outsiderWs.onmessage = e => outsiderMessages.push(JSON.parse(e.data))
        await new Promise(r => outsiderWs.onopen = r)
        ws1.send(JSON.stringify({ type: "chat-message", payload: { message: "private" } }))
        await new Promise(r => setTimeout(r, 1200))
        expect(outsiderMessages.length).toBe(0)
        outsiderWs.close()
    }, 8000)

    test("If a user leaves, the other user receives a leave event", async () => {
        ws1.close()
        const msg = await waitForMessageOfType(ws2Messages, "user-left")
        expect(msg.payload.userId).toBe(adminUserId)
    })
})
