const fs = require('fs');

const filePath = 'C:\\Users\\jasim\\Downloads\\VrseBuilderJSON_admin@autovrse.in (75).json';
const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// New chapter definition
const newChapter = {
  "name": "Echoes of Life",
  "moments": [
    {
      "momentIndex": 0,
      "id": "chapter3_moment_0",
      "name": "The World Remembers",
      "description": "The restored world responds to the player. Crystal shards glow and pulse around Island 3 — the player touches each shard to hear the world's gratitude, confirming the restoration is real.",
      "onAwake": {
        "actions": [
          {
            "Name": "Objects",
            "Query": "PRO_Crystal_Shard_01",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "Query": "PRO_Crystal_Shard_02",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "Query": "PRO_Crystal_Shard_03",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "Query": "PRO_Crystal_Shard_04",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true}",
            "Type": 0
          }
        ]
      },
      "onStart": {
        "actions": [
          {
            "Name": "VoiceOver",
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The world... it's breathing again. The shards around you are glowing — they remember what you did. Touch each one.\",\"waitForCompletion\":true}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "Query": "PRO_Crystal_Shard_01",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"}}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "Query": "PRO_Crystal_Shard_02",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"}}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "Query": "PRO_Crystal_Shard_03",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"}}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "Query": "PRO_Crystal_Shard_04",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"}}",
            "Type": 0
          }
        ]
      },
      "onRight": {
        "mode": "InOrder",
        "triggerActionSets": [
          {
            "trigger": {
              "Name": "HandTouchTrigger",
              "Query": "PRO_Crystal_Shard_01",
              "Option": "Touch",
              "Data": "{\"handOption\":\"Any\"}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"audioClipName\":\"Crystal_Snap\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"waitForCompletion\":false,\"audioRange\":5.0,\"setVolume\":0.5}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "Query": "PRO_Crystal_Shard_01",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Highlighter\":{\"setActive\":false}}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "HandTouchTrigger",
              "Query": "PRO_Crystal_Shard_02",
              "Option": "Touch",
              "Data": "{\"handOption\":\"Any\"}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"audioClipName\":\"Crystal_Snap\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"waitForCompletion\":false,\"audioRange\":5.0,\"setVolume\":0.5}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "Query": "PRO_Crystal_Shard_02",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Highlighter\":{\"setActive\":false}}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "HandTouchTrigger",
              "Query": "PRO_Crystal_Shard_03",
              "Option": "Touch",
              "Data": "{\"handOption\":\"Any\"}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"audioClipName\":\"Crystal_Snap\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"waitForCompletion\":false,\"audioRange\":5.0,\"setVolume\":0.5}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "Query": "PRO_Crystal_Shard_03",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Highlighter\":{\"setActive\":false}}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "HandTouchTrigger",
              "Query": "PRO_Crystal_Shard_04",
              "Option": "Touch",
              "Data": "{\"handOption\":\"Any\"}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"audioClipName\":\"Crystal_Snap\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"waitForCompletion\":false,\"audioRange\":5.0,\"setVolume\":0.5}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "Query": "PRO_Crystal_Shard_04",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Highlighter\":{\"setActive\":false}}",
                "Type": 0
              },
              {
                "Name": "VoiceOver",
                "Query": "VOPlayer",
                "Option": "Play",
                "Data": "{\"text\":\"*[steady exhale]* ...every piece... remembers. The world felt you.\",\"waitForCompletion\":true}",
                "Type": 0
              }
            ]
          }
        ]
      },
      "onWrong": [],
      "onFirstWarning": {
        "actions": [
          {
            "Name": "VoiceOver",
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"Touch each glowing crystal shard around you.\",\"waitForCompletion\":true}",
            "Type": 0
          }
        ]
      },
      "onLastWarning": {
        "actions": [
          {
            "Name": "VoiceOver",
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The shards are waiting for you — reach out and touch them all.\",\"waitForCompletion\":true}",
            "Type": 0
          }
        ]
      },
      "onEnd": {
        "actions": [
          {
            "Name": "VoiceOver",
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The echoes are awake. One last act remains.\",\"waitForCompletion\":true}",
            "Type": 0
          }
        ]
      },
      "sceneDescription": "Island 3 bathed in restored full-color light. Four crystal shards are scattered around the player, each glowing with a soft purple outline, pulsing gently as if alive.",
      "studio": {
        "id": "chapter3_moment_0",
        "flowNotes": [],
        "actionTriggerNodePositions": {}
      }
    },
    {
      "momentIndex": 1,
      "id": "chapter3_moment_1",
      "name": "The Offering Returns",
      "description": "The player picks up the final crystal shard (PRO_Crystal_Shard_01) and places it into its placepoint as a gift back to the world — a reciprocal act mirroring the opening moment of the story.",
      "onAwake": {
        "actions": [
          {
            "Name": "Objects",
            "Query": "PRO_Crystal_Shard_01",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "Query": "PRO_Crystal_Shard_01 placepoint",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true}",
            "Type": 0
          }
        ]
      },
      "onStart": {
        "actions": [
          {
            "Name": "VoiceOver",
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"One shard remains in your hands. The world gave you its pulse to survive — now return it. Place it back where it belongs.\",\"waitForCompletion\":true}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "Query": "PRO_Crystal_Shard_01",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Label\":{\"setActive\":true,\"labelText\":\"Return the shard\"},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"}}",
            "Type": 0
          }
        ]
      },
      "onRight": {
        "mode": "InOrder",
        "triggerActionSets": [
          {
            "trigger": {
              "Name": "GrabbableTrigger",
              "Query": "PRO_Crystal_Shard_01",
              "Option": "Grab",
              "Data": "{\"handOption\":\"Any\"}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "MetaLayerAction",
                "Query": "PRO_Crystal_Shard_01",
                "Option": "Edit",
                "Data": "{\"Label\":{\"setActive\":false}}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "PlacePointTrigger",
              "Query": "PRO_Crystal_Shard_01 placepoint",
              "Option": "Place",
              "Data": "{\"grabbableName\":\"PRO_Crystal_Shard_01\",\"disableGrabOnPlace\":true,\"createGhostMesh\":true,\"deleteGhostMeshOnPlace\":true}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"audioClipName\":\"Crystal_Snap\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"waitForCompletion\":false,\"audioRange\":5.0,\"setVolume\":0.5}",
                "Type": 0
              },
              {
                "Name": "SFXPlayer",
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"audioClipName\":\"Colour_Bloom_Flourish\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"waitForCompletion\":false,\"audioRange\":5.0,\"setVolume\":0.5}",
                "Type": 0
              },
              {
                "Name": "VoiceOver",
                "Query": "VOPlayer",
                "Option": "Play",
                "Data": "{\"text\":\"*[soft, full breath]* ...it's done. The circle is complete.\",\"waitForCompletion\":true}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "Query": "PRO_Crystal_Shard_01",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Highlighter\":{\"setActive\":false}}",
                "Type": 0
              }
            ]
          }
        ]
      },
      "onWrong": [],
      "onFirstWarning": {
        "actions": [
          {
            "Name": "VoiceOver",
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"Grab the glowing shard and place it back into its socket.\",\"waitForCompletion\":true}",
            "Type": 0
          }
        ]
      },
      "onLastWarning": {
        "actions": [
          {
            "Name": "VoiceOver",
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The placepoint is waiting. Return the shard to complete the circle.\",\"waitForCompletion\":true}",
            "Type": 0
          }
        ]
      },
      "onEnd": {
        "actions": [
          {
            "Name": "VoiceOver",
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The gift has been returned. Feel the world settle around you.\",\"waitForCompletion\":true}",
            "Type": 0
          }
        ]
      },
      "sceneDescription": "The player stands on Island 3 holding the final glowing crystal shard, reaching toward a softly pulsing placepoint socket set into the ground, the restored world vibrant and full of color around them.",
      "studio": {
        "id": "chapter3_moment_1",
        "flowNotes": [],
        "actionTriggerNodePositions": {}
      }
    },
    {
      "momentIndex": 2,
      "id": "chapter3_moment_2",
      "name": "Harmony Complete",
      "description": "The final moment. GO_Wheel_A activates as a symbol of perpetual motion and life sustained. The player watches as the wheel turns and the world hums with restored harmony. A closing voiceover seals the journey.",
      "onAwake": {
        "actions": [
          {
            "Name": "Objects",
            "Query": "GO_Wheel_A",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "Query": "GO_Prism_01",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":false}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "Query": "GO_Prism_02",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":false}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "Query": "GO_Prism_03",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":false}",
            "Type": 0
          }
        ]
      },
      "onStart": {
        "actions": [
          {
            "Name": "SFXPlayer",
            "Query": "SFXPlayer",
            "Option": "Play",
            "Data": "{\"audioClipName\":\"Colour_Bloom_Flourish\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"waitForCompletion\":false,\"audioRange\":10.0,\"setVolume\":0.6}",
            "Type": 0
          },
          {
            "Name": "VoiceOver",
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The wheel turns on its own now. It no longer needs you to push it. You gave it back its reason to spin.\",\"waitForCompletion\":true}",
            "Type": 0
          }
        ]
      },
      "onRight": {
        "mode": "Any",
        "triggerActionSets": []
      },
      "onWrong": [],
      "onFirstWarning": {
        "actions": []
      },
      "onLastWarning": {
        "actions": []
      },
      "onEnd": {
        "actions": [
          {
            "Name": "SFXPlayer",
            "Query": "SFXPlayer",
            "Option": "Play",
            "Data": "{\"audioClipName\":\"Beam_Link_02\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"waitForCompletion\":false,\"audioRange\":5.0,\"setVolume\":0.4}",
            "Type": 0
          },
          {
            "Name": "VoiceOver",
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"*[long, peaceful exhale]* The color... the sound... the life. All of it — restored. You did this. Remember that.\",\"waitForCompletion\":true}",
            "Type": 0
          },
          {
            "Name": "RadialStateAction",
            "Query": "RadialTransitionManager",
            "Option": "SetSaturation",
            "Data": "{\"saturationValue\":1.0}",
            "Type": 0
          }
        ]
      },
      "sceneDescription": "The final panoramic view of all three islands from Island 3. The wheel spins freely, prisms glow, the laser beam cuts across the sky. Everything is vivid, alive, and complete.",
      "studio": {
        "id": "chapter3_moment_2",
        "flowNotes": [],
        "actionTriggerNodePositions": {}
      }
    }
  ]
};

// Append new chapter to the story
story.chapters.push(newChapter);

fs.writeFileSync(filePath, JSON.stringify(story, null, 2), 'utf8');
console.log('Chapter 3 added successfully.');
console.log('Total chapters now:', story.chapters.length);
console.log('Chapter 3 moments:', newChapter.moments.length);
