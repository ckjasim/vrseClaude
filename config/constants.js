const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'vrse-moments'

const SESSIONS_DIR = path.join(PROJECT_ROOT, 'sessions')

const SERVICES = {
  vector:   path.join(PROJECT_ROOT, 'services', 'vectorService'),
  index:    path.join(PROJECT_ROOT, 'services', 'indexService'),
  diff:     path.join(PROJECT_ROOT, 'services', 'diffService'),
  actions:  path.join(PROJECT_ROOT, 'services', 'actionsService'),
  llm:      path.join(PROJECT_ROOT, 'services', 'llmClient'),
  sop:      path.join(PROJECT_ROOT, 'services', 'sopService'),
  creation: path.join(PROJECT_ROOT, 'services', 'creationService'),
  sfx:      path.join(PROJECT_ROOT, 'services', 'sfxService')
}

const CORE = {
  workspaceContext: path.join(PROJECT_ROOT, 'core', 'workspaceContext'),
  sessionStore:     path.join(PROJECT_ROOT, 'core', 'sessionStore'),
  contextReducer:   path.join(PROJECT_ROOT, 'core', 'contextReducer'),
  promptBuilder:    path.join(PROJECT_ROOT, 'core', 'promptBuilder'),
  toolRegistry:     path.join(PROJECT_ROOT, 'core', 'toolRegistry')
}

const INTEGRITY = {
  merkleTree: path.join(PROJECT_ROOT, 'integrity', 'merkleTree')
}

const PIPELINE = {
  executor: path.join(PROJECT_ROOT, 'pipeline', 'executor'),
  verifier: path.join(PROJECT_ROOT, 'pipeline', 'verifier')
}

module.exports = { PROJECT_ROOT, PINECONE_INDEX_NAME, SESSIONS_DIR, SERVICES, CORE, INTEGRITY, PIPELINE }
