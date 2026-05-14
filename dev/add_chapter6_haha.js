const fs = require('fs');

const filePath = 'C:\\Users\\jasim\\Downloads\\haha.json';
const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const newChapter = {
  "name": "The Blossom Ritual",
  "moments": [
    {
      "name": "Tune the Bells",
      "momentIndex": 0,
      "onAwake": {
        "actions": [
          {
            "Name": "Objects",
            "ID": 101001,
            "Query": "GO_Xylophone_Stick",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 101001,
            "Query": "GO_Xylophone_Stick",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"},\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 101002,
            "Query": "GO_Xylophone_Bone_A",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"},\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onStart": {
        "actions": [
          {
            "Name": "Objects",
            "ID": 101010,
            "Query": "UI 3",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":false,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "TextMediaAction",
            "ID": 101010,
            "Query": "UI 3",
            "Option": "Enable",
            "Data": "{\"content\":\"The bells remember the old melody. Grab the stick and strike the bones in the correct order: A, C, B, A.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The ritual begins with music. Grab the xylophone stick and strike the bones in order — A, C, B, then A again — to wake the melody.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onWrong": [],
      "onRight": {
        "mode": "InOrder",
        "triggerActionSets": [
          {
            "trigger": {
              "Name": "GrabbableTrigger",
              "ID": 101001,
              "Query": "GO_Xylophone_Stick",
              "Option": "Grab",
              "Data": "{\"handOption\":\"Any\",\"targetRoleSetId\":0}",
              "Type": 1
            },
            "actions": [
              {
                "Name": "MetaLayerAction",
                "ID": 101001,
                "Query": "GO_Xylophone_Stick",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Highlighter\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "CollisionTrigger",
              "ID": 101002,
              "Query": "GO_Xylophone_Bone_A",
              "Option": "Enter",
              "Data": "{\"targetCollisionGameObject\":\"GO_Xylophone_Stick\",\"isTrigger\":true,\"targetRoleSetId\":0}",
              "Type": 1
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":false,\"audioClipName\":\"Sounds/xylo 1\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"audioRange\":10,\"setVolume\":0.65,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "HapticsAction",
                "ID": 101001,
                "Query": "GO_Xylophone_Stick",
                "Option": "Both",
                "Data": "{\"waitForCompletion\":false,\"hapticIntensity\":0.25,\"hapticDuration\":0.15,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 101003,
                "Query": "GO_Xylophone_Bone_C",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 101002,
                "Query": "GO_Xylophone_Bone_A",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Highlighter\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "CollisionTrigger",
              "ID": 101003,
              "Query": "GO_Bone_C_Collider",
              "Option": "Enter",
              "Data": "{\"targetCollisionGameObject\":\"GO_Xylophone_Stick\",\"isTrigger\":true,\"targetRoleSetId\":0}",
              "Type": 1
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":false,\"audioClipName\":\"Sounds/xylo 3\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"audioRange\":10,\"setVolume\":0.65,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "HapticsAction",
                "ID": 101001,
                "Query": "GO_Xylophone_Stick",
                "Option": "Both",
                "Data": "{\"waitForCompletion\":false,\"hapticIntensity\":0.25,\"hapticDuration\":0.15,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 101004,
                "Query": "GO_Xylophone_Bone_B",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 101003,
                "Query": "GO_Xylophone_Bone_C",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Highlighter\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "CollisionTrigger",
              "ID": 101004,
              "Query": "GO_Bone_B_Collider",
              "Option": "Enter",
              "Data": "{\"targetCollisionGameObject\":\"GO_Xylophone_Stick\",\"isTrigger\":true,\"targetRoleSetId\":0}",
              "Type": 1
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":false,\"audioClipName\":\"Sounds/xylo 2\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"audioRange\":10,\"setVolume\":0.65,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "HapticsAction",
                "ID": 101001,
                "Query": "GO_Xylophone_Stick",
                "Option": "Both",
                "Data": "{\"waitForCompletion\":false,\"hapticIntensity\":0.25,\"hapticDuration\":0.15,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 101002,
                "Query": "GO_Xylophone_Bone_A",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 101004,
                "Query": "GO_Xylophone_Bone_B",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Highlighter\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "CollisionTrigger",
              "ID": 101002,
              "Query": "GO_Xylophone_Bone_A",
              "Option": "Enter",
              "Data": "{\"targetCollisionGameObject\":\"GO_Xylophone_Stick\",\"isTrigger\":true,\"targetRoleSetId\":0}",
              "Type": 1
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":true,\"audioClipName\":\"Sounds/xylo 1\",\"useCloudAudio\":true,\"audioUrl\":\"https://GENERATE_THIS.com\",\"audioRange\":10,\"setVolume\":0.75,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "HapticsAction",
                "ID": 101001,
                "Query": "GO_Xylophone_Stick",
                "Option": "Both",
                "Data": "{\"waitForCompletion\":false,\"hapticIntensity\":0.45,\"hapticDuration\":0.3,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "VoiceOver",
                "ID": 891093,
                "Query": "VOPlayer",
                "Option": "Play",
                "Data": "{\"text\":\"The melody is complete. The bells have spoken.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 101002,
                "Query": "GO_Xylophone_Bone_A",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Highlighter\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          }
        ]
      },
      "onFirstWarning": {
        "actions": [
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"Grab the xylophone stick first, then strike the highlighted bone.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onLastWarning": {
        "actions": [
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"Follow the glowing bone — the order is A, C, B, then A again.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onEnd": {
        "actions": [
          {
            "Name": "Objects",
            "ID": 101010,
            "Query": "UI 3",
            "Option": "Despawn",
            "Data": "{\"waitForCompletion\":false,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The bells are awake. Head to Island 2 for the next part of the ritual.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "defaults": "",
      "studio": {
        "id": "chapter6_moment_0",
        "flowNotes": [],
        "actionTriggerNodePositions": {}
      }
    },
    {
      "name": "Scatter and Gather",
      "momentIndex": 1,
      "onAwake": {
        "actions": [
          {
            "Name": "Objects",
            "ID": 734378,
            "Query": "GO_Offering_Bowl",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 734378,
            "Query": "GO_Offering_Bowl",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Label\":{\"labelText\":\"Offering Bowl — 0/5\",\"setActive\":true},\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "ID": 480829,
            "Query": "PRO_Flower_Purple_01",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "ID": 32306,
            "Query": "PRO_Flower_Purple_02",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "ID": 639167,
            "Query": "PRO_Flower_Purple_03",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "ID": 270164,
            "Query": "PRO_Flower_Purple_04",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "ID": 363502,
            "Query": "PRO_Flower_Purple_05",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "GrabbablePropertyChangeAction",
            "ID": 480829,
            "Query": "PRO_Flower_Purple_01",
            "Option": "ChangeIsGrabbable",
            "Data": "{\"isGrabbable\":true,\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "GrabbablePropertyChangeAction",
            "ID": 32306,
            "Query": "PRO_Flower_Purple_02",
            "Option": "ChangeIsGrabbable",
            "Data": "{\"isGrabbable\":true,\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "GrabbablePropertyChangeAction",
            "ID": 639167,
            "Query": "PRO_Flower_Purple_03",
            "Option": "ChangeIsGrabbable",
            "Data": "{\"isGrabbable\":true,\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "GrabbablePropertyChangeAction",
            "ID": 270164,
            "Query": "PRO_Flower_Purple_04",
            "Option": "ChangeIsGrabbable",
            "Data": "{\"isGrabbable\":true,\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "GrabbablePropertyChangeAction",
            "ID": 363502,
            "Query": "PRO_Flower_Purple_05",
            "Option": "ChangeIsGrabbable",
            "Data": "{\"isGrabbable\":true,\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 480829,
            "Query": "PRO_Flower_Purple_01",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Label\":{\"labelText\":\"Purple Flower\",\"setActive\":true},\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 32306,
            "Query": "PRO_Flower_Purple_02",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Label\":{\"labelText\":\"Purple Flower\",\"setActive\":true},\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 639167,
            "Query": "PRO_Flower_Purple_03",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Label\":{\"labelText\":\"Purple Flower\",\"setActive\":true},\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 270164,
            "Query": "PRO_Flower_Purple_04",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Label\":{\"labelText\":\"Purple Flower\",\"setActive\":true},\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 363502,
            "Query": "PRO_Flower_Purple_05",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Label\":{\"labelText\":\"Purple Flower\",\"setActive\":true},\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onStart": {
        "actions": [
          {
            "Name": "Objects",
            "ID": 102010,
            "Query": "UI 4",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":false,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "TextMediaAction",
            "ID": 102010,
            "Query": "UI 4",
            "Option": "Enable",
            "Data": "{\"content\":\"The five ritual flowers are scattered across Island 2. Gather each one and place it into the offering bowl to complete the blossom pattern.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The five sacred flowers have scattered in the wind. Gather them all and place each one into the offering bowl. The ritual demands all five.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onWrong": [],
      "onRight": {
        "mode": "InOrder",
        "triggerActionSets": [
          {
            "trigger": {
              "Name": "PlacePointTrigger",
              "ID": 102101,
              "Query": "Flower_1_pp",
              "Option": "Place",
              "Data": "{\"grabbableName\":\"PRO_Flower_Purple_01#$480829\",\"enableGrab\":true,\"disableGrabOnPlace\":true,\"createGhostMesh\":true,\"deleteGhostMeshOnPlace\":true,\"targetRoleSetId\":0}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":false,\"audioClipName\":\"flower_place\",\"audioRange\":10,\"setVolume\":0.65,\"useCloudAudio\":true,\"audioUrl\":\"https://d3rispyzvykwg6.cloudfront.net/note-contents/audio/010db804-012d-4881-a151-3d1412ac896a\",\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "HapticsAction",
                "ID": 734378,
                "Query": "GO_Offering_Bowl",
                "Option": "Both",
                "Data": "{\"waitForCompletion\":false,\"hapticIntensity\":0.35,\"hapticDuration\":0.2,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 480829,
                "Query": "PRO_Flower_Purple_01",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Label\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 734378,
                "Query": "GO_Offering_Bowl",
                "Option": "Edit",
                "Data": "{\"Label\":{\"labelText\":\"Offering Bowl — 1/5\",\"setActive\":true},\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "PlacePointTrigger",
              "ID": 102102,
              "Query": "Flower_2_pp",
              "Option": "Place",
              "Data": "{\"grabbableName\":\"PRO_Flower_Purple_02#$32306\",\"enableGrab\":true,\"disableGrabOnPlace\":true,\"createGhostMesh\":true,\"deleteGhostMeshOnPlace\":true,\"targetRoleSetId\":0}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":false,\"audioClipName\":\"flower_place\",\"audioRange\":10,\"setVolume\":0.65,\"useCloudAudio\":true,\"audioUrl\":\"https://d3rispyzvykwg6.cloudfront.net/note-contents/audio/66e937c0-1979-46bf-9382-00611b50e425\",\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "HapticsAction",
                "ID": 734378,
                "Query": "GO_Offering_Bowl",
                "Option": "Both",
                "Data": "{\"waitForCompletion\":false,\"hapticIntensity\":0.35,\"hapticDuration\":0.2,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 32306,
                "Query": "PRO_Flower_Purple_02",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Label\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 734378,
                "Query": "GO_Offering_Bowl",
                "Option": "Edit",
                "Data": "{\"Label\":{\"labelText\":\"Offering Bowl — 2/5\",\"setActive\":true},\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "PlacePointTrigger",
              "ID": 102103,
              "Query": "Flower_3_pp",
              "Option": "Place",
              "Data": "{\"grabbableName\":\"PRO_Flower_Purple_03#$639167\",\"enableGrab\":true,\"disableGrabOnPlace\":true,\"createGhostMesh\":true,\"deleteGhostMeshOnPlace\":true,\"targetRoleSetId\":0}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":false,\"audioClipName\":\"flower_place\",\"audioRange\":10,\"setVolume\":0.65,\"useCloudAudio\":true,\"audioUrl\":\"https://d3rispyzvykwg6.cloudfront.net/note-contents/audio/b2e0e8de-5107-4d21-8c0e-dad2165dc773\",\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "HapticsAction",
                "ID": 734378,
                "Query": "GO_Offering_Bowl",
                "Option": "Both",
                "Data": "{\"waitForCompletion\":false,\"hapticIntensity\":0.35,\"hapticDuration\":0.2,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 639167,
                "Query": "PRO_Flower_Purple_03",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Label\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 734378,
                "Query": "GO_Offering_Bowl",
                "Option": "Edit",
                "Data": "{\"Label\":{\"labelText\":\"Offering Bowl — 3/5\",\"setActive\":true},\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "PlacePointTrigger",
              "ID": 102104,
              "Query": "Flower_4_pp",
              "Option": "Place",
              "Data": "{\"grabbableName\":\"PRO_Flower_Purple_04#$270164\",\"enableGrab\":true,\"disableGrabOnPlace\":true,\"createGhostMesh\":true,\"deleteGhostMeshOnPlace\":true,\"targetRoleSetId\":0}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":false,\"audioClipName\":\"flower_place\",\"audioRange\":10,\"setVolume\":0.65,\"useCloudAudio\":true,\"audioUrl\":\"https://d3rispyzvykwg6.cloudfront.net/note-contents/audio/ee8daecd-4529-421a-bc2c-0725a9866a20\",\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "HapticsAction",
                "ID": 734378,
                "Query": "GO_Offering_Bowl",
                "Option": "Both",
                "Data": "{\"waitForCompletion\":false,\"hapticIntensity\":0.35,\"hapticDuration\":0.2,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 270164,
                "Query": "PRO_Flower_Purple_04",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Label\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 734378,
                "Query": "GO_Offering_Bowl",
                "Option": "Edit",
                "Data": "{\"Label\":{\"labelText\":\"Offering Bowl — 4/5\",\"setActive\":true},\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "PlacePointTrigger",
              "ID": 102105,
              "Query": "Flower_5_pp",
              "Option": "Place",
              "Data": "{\"grabbableName\":\"PRO_Flower_Purple_05#$363502\",\"enableGrab\":true,\"disableGrabOnPlace\":true,\"createGhostMesh\":true,\"deleteGhostMeshOnPlace\":true,\"targetRoleSetId\":0}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":false,\"audioClipName\":\"flower_place\",\"audioRange\":10,\"setVolume\":0.65,\"useCloudAudio\":true,\"audioUrl\":\"https://d3rispyzvykwg6.cloudfront.net/note-contents/audio/52eccd8f-7727-4169-8c28-e7dca84cf5ff\",\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":true,\"audioClipName\":\"task_complete\",\"audioRange\":12,\"setVolume\":0.75,\"useCloudAudio\":true,\"audioUrl\":\"https://d3rispyzvykwg6.cloudfront.net/note-contents/audio/0c94a5e3-c7b4-4023-9f72-554e45d99de9\",\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "HapticsAction",
                "ID": 734378,
                "Query": "GO_Offering_Bowl",
                "Option": "Both",
                "Data": "{\"waitForCompletion\":false,\"hapticIntensity\":0.5,\"hapticDuration\":0.4,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 363502,
                "Query": "PRO_Flower_Purple_05",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Label\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 734378,
                "Query": "GO_Offering_Bowl",
                "Option": "Edit",
                "Data": "{\"Label\":{\"labelText\":\"✔ 5/5\",\"setActive\":true},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "VoiceOver",
                "ID": 891093,
                "Query": "VOPlayer",
                "Option": "Play",
                "Data": "{\"text\":\"All five flowers returned. The bowl overflows with colour. The ritual is nearly complete.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "RadialStateAction",
                "ID": -1,
                "Query": "Island_2",
                "Option": "SetSaturation",
                "Data": "{\"saturationValue\":1.0,\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          }
        ]
      },
      "onFirstWarning": {
        "actions": [
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"Find the glowing purple flowers and bring each one to the offering bowl.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onLastWarning": {
        "actions": [
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"Grab a flower and hold it over the bowl, then let go to place it.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 734378,
            "Query": "GO_Offering_Bowl",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":3.0},\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onEnd": {
        "actions": [
          {
            "Name": "Objects",
            "ID": 102010,
            "Query": "UI 4",
            "Option": "Despawn",
            "Data": "{\"waitForCompletion\":false,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 734378,
            "Query": "GO_Offering_Bowl",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":false},\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The offering is complete. One final act awaits on Island 3.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "defaults": "",
      "studio": {
        "id": "chapter6_moment_1",
        "flowNotes": [],
        "actionTriggerNodePositions": {}
      }
    },
    {
      "name": "The Final Bloom",
      "momentIndex": 2,
      "onAwake": {
        "actions": [
          {
            "Name": "Objects",
            "ID": 439023,
            "Query": "GO_Crystal_01",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "Objects",
            "ID": 103001,
            "Query": "GO_Prism_03",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "GrabbablePropertyChangeAction",
            "ID": 439023,
            "Query": "GO_Crystal_01",
            "Option": "ChangeIsGrabbable",
            "Data": "{\"isGrabbable\":true,\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 439023,
            "Query": "GO_Crystal_01",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Label\":{\"labelText\":\"Ritual Crystal\",\"setActive\":true},\"Highlighter\":{\"setActive\":true,\"material\":\"Materials/_ObjectHighligherMaterial_\"},\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 103001,
            "Query": "GO_Prism_03",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":2.0},\"Label\":{\"labelText\":\"Final Prism\",\"setActive\":true},\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onStart": {
        "actions": [
          {
            "Name": "Objects",
            "ID": 103010,
            "Query": "UI 8",
            "Option": "Spawn",
            "Data": "{\"waitForCompletion\":false,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "TextMediaAction",
            "ID": 103010,
            "Query": "UI 8",
            "Option": "Enable",
            "Data": "{\"content\":\"Grab the Ritual Crystal and carry it to the Final Prism on Island 3 to complete the Blossom Ritual and restore Chromatica.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"This is it. The ritual crystal holds everything you have restored. Carry it to the final prism on Island 3 and let it bloom.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onWrong": [],
      "onRight": {
        "mode": "InOrder",
        "triggerActionSets": [
          {
            "trigger": {
              "Name": "GrabbableTrigger",
              "ID": 439023,
              "Query": "GO_Crystal_01",
              "Option": "Grab",
              "Data": "{\"handOption\":\"Any\",\"targetRoleSetId\":0}",
              "Type": 1
            },
            "actions": [
              {
                "Name": "MetaLayerAction",
                "ID": 439023,
                "Query": "GO_Crystal_01",
                "Option": "Edit",
                "Data": "{\"Highlighter\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "VoiceOver",
                "ID": 891093,
                "Query": "VOPlayer",
                "Option": "Play",
                "Data": "{\"text\":\"Feel the warmth of it. Now bring it to the prism.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          },
          {
            "trigger": {
              "Name": "PlacePointTrigger",
              "ID": 103001,
              "Query": "GO_Crystal_01 placepoint",
              "Option": "Place",
              "Data": "{\"grabbableName\":\"GO_Crystal_01#$439023\",\"enableGrab\":false,\"disableGrabOnPlace\":true,\"createGhostMesh\":true,\"deleteGhostMeshOnPlace\":true,\"targetRoleSetId\":0}",
              "Type": 0
            },
            "actions": [
              {
                "Name": "SFXPlayer",
                "ID": 89495,
                "Query": "SFXPlayer",
                "Option": "Play",
                "Data": "{\"waitForCompletion\":false,\"audioClipName\":\"task_complete\",\"audioRange\":15,\"setVolume\":0.8,\"useCloudAudio\":true,\"audioUrl\":\"https://d3rispyzvykwg6.cloudfront.net/note-contents/audio/0c94a5e3-c7b4-4023-9f72-554e45d99de9\",\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "HapticsAction",
                "ID": 439023,
                "Query": "GO_Crystal_01",
                "Option": "Both",
                "Data": "{\"waitForCompletion\":false,\"hapticIntensity\":0.6,\"hapticDuration\":0.5,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "Objects",
                "ID": 103002,
                "Query": "Laser",
                "Option": "Spawn",
                "Data": "{\"waitForCompletion\":true,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "RadialStateAction",
                "ID": -1,
                "Query": "RadialTransitionManager",
                "Option": "SetSaturation",
                "Data": "{\"saturationValue\":1.0,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "VoiceOver",
                "ID": 891093,
                "Query": "VOPlayer",
                "Option": "Play",
                "Data": "{\"text\":\"The Blossom Ritual is complete. Chromatica breathes again — full of colour, full of life. You did this.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 439023,
                "Query": "GO_Crystal_01",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Label\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              },
              {
                "Name": "MetaLayerAction",
                "ID": 103001,
                "Query": "GO_Prism_03",
                "Option": "Edit",
                "Data": "{\"Outline\":{\"setActive\":false},\"Label\":{\"setActive\":false},\"targetRoleSetId\":0}",
                "Type": 0
              }
            ]
          }
        ]
      },
      "onFirstWarning": {
        "actions": [
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"Grab the glowing ritual crystal first, then carry it to the final prism.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onLastWarning": {
        "actions": [
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The prism is waiting. Hold the crystal over it and release.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "MetaLayerAction",
            "ID": 103001,
            "Query": "GO_Prism_03",
            "Option": "Edit",
            "Data": "{\"Outline\":{\"setActive\":true,\"outlineColor\":\"#A328F3FF\",\"outlineWidth\":3.0},\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "onEnd": {
        "actions": [
          {
            "Name": "Objects",
            "ID": 103010,
            "Query": "UI 8",
            "Option": "Despawn",
            "Data": "{\"waitForCompletion\":false,\"targetRoleSetId\":0}",
            "Type": 0
          },
          {
            "Name": "VoiceOver",
            "ID": 891093,
            "Query": "VOPlayer",
            "Option": "Play",
            "Data": "{\"text\":\"The world is whole. Your journey through Chromatica is complete.\",\"waitForCompletion\":true,\"targetRoleSetId\":0}",
            "Type": 0
          }
        ]
      },
      "defaults": "",
      "studio": {
        "id": "chapter6_moment_2",
        "flowNotes": [],
        "actionTriggerNodePositions": {}
      }
    }
  ]
};

story.chapters.push(newChapter);

fs.writeFileSync(filePath, JSON.stringify(story, null, 2), 'utf8');
console.log('Chapter 6 added successfully.');
console.log('Total chapters now:', story.chapters.length);
console.log('Chapter 6 moments:', newChapter.moments.length);
console.log('Total moments:', story.chapters.reduce((sum, c) => sum + c.moments.length, 0));
