### Plan des Diagrammes UML


enum user_role {
  user
  moderator
  admin
}

enum account_status {
  active
  suspended
  banned
}

enum report_status {
  open
  under_review
  resolved
  rejected
}

enum report_reason_category {
  fraud
  abuse
  spam
  other
}

enum conversation_type {
  direct
}

class User {
  - id: Integer
  - pseudo: String
  - email: String
  - password: String
  - role: user_role
  - status: account_status
  - banned_until: DateTime
  - banned_at: DateTime
  - ban_reason: String
  - banned_by_id: Integer
  - created_at: DateTime
  - firebase_uid: String
  - discord_username: String
  - discord_user_id: String
  - discord_connected_at: DateTime
  + register(email, password, pseudo)
  + login(email, password)
  + updateProfile()
  + changePassword()
  + banUser(reason, until)
  + unbanUser()
}

class Portfolio {
  - id: Integer
  - user_id: Integer
  - balance: Float
  - total_deposited: Float
  - created_at: DateTime
  + addFunds(amount)
  + getBalance()
  + calculateTotalValue()
  + getHoldings()
}

class PortfolioTransaction {
  - id: Integer
  - portfolio_id: Integer
  - crypto_id: Integer
  - type: String
  - quantity: Float
  - price_usd: Float
  - timestamp: DateTime
  + recordBuy(crypto, quantity, price)
  + recordSell(crypto, quantity, price)
}

class Crypto {
  - id: Integer
  - symbol: String
  - name: String
  - created_at: DateTime
  + getDetails()
  + getCurrentPrice()
  + getHistoricalData()
}

class CryptoPrice {
  - id: Integer
  - crypto_id: Integer
  - price_usd: Decimal
  - volume_usd_24h: Decimal
  - market_cap_usd: Decimal
  - change_percent_24h: Decimal
  - fetched_at: DateTime
  - high_24h: Decimal
  - low_24h: Decimal
  - circulating_supply: Decimal
  - total_supply: Decimal
  - ath: Decimal
  - atl: Decimal
  + fetchFromAPI()
  + calculateChange()
}

class Alert {
  - id: Integer
  - user_id: Integer
  - crypto_id: Integer
  - alert_type: String
  - threshold: Decimal
  - is_triggered: Boolean
  - created_at: DateTime
  - triggered_at: DateTime
  + create(type, threshold)
  + check()
  + trigger()
  + delete()
}

class Conversation {
  - id: Integer
  - type: conversation_type
  - direct_key: String
  - created_at: DateTime
  - updated_at: DateTime
  + createDirectConversation(userA, userB)
  + addParticipant(user)
  + sendMessage(sender, body)
  + getMessages(limit, before)
}

class ConversationParticipant {
  - id: Integer
  - conversation_id: Integer
  - user_id: Integer
  - joined_at: DateTime
  - last_read_at: DateTime
  + markAsRead()
  + getUnreadCount()
}

class Message {
  - id: Integer
  - conversation_id: Integer
  - sender_id: Integer
  - body: String
  - created_at: DateTime
  + send()
  + edit()
  + delete()
}

class WalletTransfer {
  - id: Integer
  - sender_id: Integer
  - receiver_id: Integer
  - amount: Float
  - reason: String
  - created_at: DateTime
  + transfer(sender, receiver, amount)
  + validate()
  + notify()
}

class Report {
  - id: Integer
  - reported_user_id: Integer
  - reported_by_id: Integer
  - reason_category: report_reason_category
  - reason_text: String
  - evidence: String
  - status: report_status
  - admin_decision_by_id: Integer
  - admin_decision_at: DateTime
  - admin_decision_note: String
  - created_at: DateTime
  - updated_at: DateTime
  + create(reportedUser, reason)
  + review(admin, decision)
  + resolve()
  + reject()
}

class AuditLog {
  - id: Integer
  - actor_id: Integer
  - action: String
  - target_user_id: Integer
  - report_id: Integer
  - metadata: JSON
  - created_at: DateTime
  + log(action, actor, target)
  + getHistory(user)
}

class IndicatorsHistory {
  - id: Integer
  - crypto_id: Integer
  - fetched_at: DateTime
  - sma7: Decimal
  - sma30: Decimal
  - variation_24h: Decimal
  + calculateSMA(period)
  + calculateRSI()
  + calculateMACD()
}

class AppSettings {
  - key: String
  - maintenance_enabled: Boolean
  - maintenance_message: String
  - created_at: DateTime
  - updated_at: DateTime
  + enableMaintenance(message)
  + disableMaintenance()
}

User "1" -- "1" Portfolio : possède
User "1" -- "*" Alert : crée
User "1" -- "*" Report : signale/reçoit
User "1" -- "*" ConversationParticipant : participe
User "1" -- "*" Message : envoie
User "1" -- "*" WalletTransfer : envoie/reçoit
User "1" -- "*" AuditLog : acteur/cible
User "*" -- "1" User : banni par

Portfolio "1" -- "*" PortfolioTransaction : contient

PortfolioTransaction "*" -- "1" Crypto : concerne

Crypto "1" -- "*" CryptoPrice : a
Crypto "1" -- "*" Alert : surveille
Crypto "1" -- "*" IndicatorsHistory : possède

Conversation "1" -- "*" ConversationParticipant : a
Conversation "1" -- "*" Message : contient

Report "*" -- "1" User : concerne
Report "*" -- "1" AuditLog : génère

User -- user_role
User -- account_status
Report -- report_status
Report -- report_reason_category
Conversation -- conversation_type




skinparam shadowing false

[*] --> NonInscrit

NonInscrit --> Actif : register()
NonInscrit --> Actif : loginWithFirebase()

Actif --> Suspendu : violationDetectée()
Actif --> Banni : admin.banUser()
Actif --> VerificationEmail : sendVerificationEmail()

VerificationEmail --> Actif : emailVerified()

Suspendu --> Actif : admin.liftSuspension()
Suspendu --> Banni : admin.banUser()

Banni --> Actif : admin.unbanUser() / banExpired()
Banni --> Supprimé : admin.deleteUser()

Actif --> Supprimé : user.deleteAccount()
Suspendu --> Supprimé : admin.deleteUser()

Supprimé --> [*]

state Actif {
  [*] --> Inactif
  Inactif --> EnLigne : login()
  EnLigne --> Inactif : logout()
  EnLigne --> EnTrading : openTradingPage()
  EnTrading --> EnLigne : closeTradingPage()
}

note right of Banni
  Peut être temporaire
  (banned_until) ou
  permanent (banned_until = null)
end note




skinparam shadowing false

[*] --> Initiée

Initiée --> ValidationBalance : buyCrypto() / sellCrypto()

ValidationBalance --> Rejetée : soldeInsuffisant()
ValidationBalance --> ValidationQuantité : soldeOK()

ValidationQuantité --> Rejetée : quantitéInvalide()
ValidationQuantité --> ValidationPrix : quantitéOK()

ValidationPrix --> Rejetée : prixIndisponible()
ValidationPrix --> EnTraitement : prixOK()

EnTraitement --> Échouée : erreurBDD()
EnTraitement --> Confirmée : transactionEnregistrée()

Confirmée --> Notifiée : notificationEnvoyée()

Rejetée --> [*]
Échouée --> [*]
Notifiée --> [*]

note right of Confirmée
  - Balance mise à jour
  - Transaction enregistrée
  - Holdings calculés
end note




skinparam shadowing false

[*] --> Créée

Créée --> Active : alerteValidée()
Créée --> Invalide : erreurValidation()

Active --> EnVérification : workerCheck()

EnVérification --> Active : conditionNonRemplie()
EnVérification --> Déclenchée : conditionRemplie()

Déclenchée --> Notifiée : notificationEnvoyée()

Notifiée --> Archivée : user.archive()
Notifiée --> Supprimée : user.delete()

Active --> Suspendue : user.pause()
Suspendue --> Active : user.resume()
Suspendue --> Supprimée : user.delete()

Active --> Supprimée : user.delete()
Archivée --> Supprimée : user.delete()

Invalide --> [*]
Supprimée --> [*]

note right of Active
  Vérification toutes les
  60 secondes par le worker
end note




skinparam shadowing false

[*] --> Ouvert

Ouvert --> EnExamen : admin.review()
Ouvert --> Rejeté : admin.reject()

EnExamen --> Résolu : admin.resolve()
EnExamen --> Rejeté : admin.reject()
EnExamen --> Ouvert : admin.needMoreInfo()

Résolu --> Archivé : autoArchive(30days)
Rejeté --> Archivé : autoArchive(30days)

Archivé --> [*]

state Résolu {
  [*] --> ActionTaken
  ActionTaken --> UserBanned : banUser()
  ActionTaken --> UserWarned : warnUser()
  ActionTaken --> ContentRemoved : removeContent()
}

note right of EnExamen
  L'admin examine:
  - Le contenu signalé
  - Les preuves
  - L'historique
end note




skinparam shadowing false

[*] --> Initialisée

Initialisée --> Active : premierMessage()

Active --> NonLue : nouveauMessage()
NonLue --> Lue : participantLit()

Lue --> NonLue : nouveauMessage()
Active --> Lue : tousMessagesLus()

Active --> Archivée : participant.archive()
Archivée --> Active : nouveauMessage()

Active --> Supprimée : tousParticipants.delete()
Archivée --> Supprimée : participant.delete()

Supprimée --> [*]

note right of Active
  Messages en temps réel
  via Server-Sent Events
end note




skinparam shadowing false

left to right direction

actor Utilisateur as user
actor Administrateur as admin
actor "Système\nCollecteur" as system
actor "API\nCoinGecko" as coingecko

rectangle "Plateforme de Trading Crypto" {
  
  package "Gestion Compte" {
    usecase (S'inscrire) as UC1
    usecase (Se connecter) as UC2
    usecase (Réinitialiser mot de passe) as UC3
    usecase (Modifier profil) as UC4
    usecase (Lier compte Discord) as UC5
    usecase (Supprimer compte) as UC6
  }
  
  package "Portfolio et Trading" {
    usecase (Consulter portefeuille) as UC7
    usecase (Ajouter des fonds) as UC8
    usecase (Acheter crypto) as UC9
    usecase (Vendre crypto) as UC10
    usecase (Voir historique transactions) as UC11
    usecase (Transférer fonds à utilisateur) as UC12
  }
  
  package "Suivi du Marché" {
    usecase (Consulter prix cryptos) as UC13
    usecase (Voir graphiques historiques) as UC14
    usecase (Consulter indicateurs techniques) as UC15
    usecase (Rechercher crypto) as UC16
  }
  
  package "Alertes" {
    usecase (Créer alerte prix) as UC17
    usecase (Créer alerte indicateur) as UC18
    usecase (Gérer mes alertes) as UC19
    usecase (Recevoir notifications) as UC20
  }
  
  package "Communication" {
    usecase (Envoyer message) as UC21
    usecase (Lire messages) as UC22
    usecase (Créer conversation) as UC23
    usecase (Recevoir messages temps réel) as UC24
  }
  
  package "Signalements" {
    usecase (Signaler utilisateur) as UC25
    usecase (Consulter mes signalements) as UC26
  }
  
  package "Administration" {
    usecase (Gérer utilisateurs) as UC27
    usecase (Bannir utilisateur) as UC28
    usecase (Modifier rôle utilisateur) as UC29
    usecase (Traiter rapports) as UC30
    usecase (Consulter logs d'audit) as UC31
    usecase (Activer mode maintenance) as UC32
    usecase (Voir statistiques plateforme) as UC33
  }
  
  package "Collecte Automatique" {
    usecase (Collecter prix cryptos) as UC34
    usecase (Calculer indicateurs) as UC35
    usecase (Vérifier alertes) as UC36
    usecase (Notifier utilisateurs) as UC37
    usecase (Archiver données) as UC38
  }
}

user --> UC1
user --> UC2
user --> UC3
user --> UC4
user --> UC5
user --> UC6
user --> UC7
user --> UC8
user --> UC9
user --> UC10
user --> UC11
user --> UC12
user --> UC13
user --> UC14
user --> UC15
user --> UC16
user --> UC17
user --> UC18
user --> UC19
user --> UC20
user --> UC21
user --> UC22
user --> UC23
user --> UC24
user --> UC25
user --> UC26

admin --> UC27
admin --> UC28
admin --> UC29
admin --> UC30
admin --> UC31
admin --> UC32
admin --> UC33

system --> UC34
system --> UC35
system --> UC36
system --> UC37
system --> UC38

UC34 --> coingecko : utilise API
UC1 ..> UC7 : <<include>>
UC9 ..> UC7 : <<include>>
UC10 ..> UC7 : <<include>>
UC9 ..> UC13 : <<include>>
UC10 ..> UC13 : <<include>>
UC17 ..> UC13 : <<include>>
UC18 ..> UC15 : <<include>>
UC36 ..> UC20 : <<include>>
UC34 ..> UC35 : <<include>>
UC35 ..> UC36 : <<include>>
UC12 ..> UC21 : <<include>>
UC28 ..> UC31 : <<include>>
UC30 ..> UC31 : <<include>>

note right of UC34
  Exécuté toutes les 60 secondes
  par un worker BullMQ
end note

note right of UC24
  Communication en temps réel
  via Server-Sent Events
end note

note right of UC9
  Vérification du solde
  avant transaction
end note




skinparam shadowing false

actor Utilisateur as user
participant "Frontend\nReact" as frontend
participant "API\nExpress" as api
participant "Portfolio\nController" as controller
participant "Portfolio\nService" as service
participant "Database\nPostgreSQL" as db
participant "Realtime\nSSE" as sse

user -> frontend : Sélectionne crypto\net quantité
activate frontend

frontend -> api : POST /api/portfolio/buy\n{symbol, quantity}
activate api

api -> controller : buyCryptoController()
activate controller

controller -> service : buyCrypto(userId, symbol, quantity)
activate service

service -> db : SELECT crypto WHERE symbol
activate db
db --> service : crypto
deactivate db

service -> db : SELECT crypto_prices\nORDER BY fetched_at DESC
activate db
db --> service : currentPrice
deactivate db

service -> db : SELECT portfolio\nWHERE user_id
activate db
db --> service : portfolio
deactivate db

alt Solde insuffisant
  service --> controller : Error("Solde insuffisant")
  controller --> api : 400 Error
  api --> frontend : Error Response
  frontend --> user : Message d'erreur
else Solde suffisant
  service -> db : UPDATE portfolio\nSET balance = balance - cost
  activate db
  db --> service : OK
  deactivate db
  
  service -> db : INSERT portfolio_transaction
  activate db
  db --> service : transaction created
  deactivate db
  
  service -> db : SELECT portfolio with holdings
  activate db
  db --> service : updated portfolio
  deactivate db
  
  service --> controller : portfolio data
  deactivate service
  
  controller -> sse : publishToUser(userId,\n"portfolio:changed")
  activate sse
  sse --> frontend : SSE Event
  deactivate sse
  
  controller --> api : Success Response
  deactivate controller
  
  api --> frontend : JSON portfolio
  deactivate api
  
  frontend --> user : Affiche confirmation\net nouveau solde
  deactivate frontend
end




skinparam shadowing false

participant "BullMQ\nWorker" as worker
participant "Price\nService" as service
participant "CoinGecko\nAPI" as coingecko
participant "Database\nPostgreSQL" as db
participant "Indicator\nService" as indicator
participant "Alert\nService" as alert
participant "Realtime\nSSE" as sse
participant "Users\nConnectés" as users

activate worker
worker -> worker : Cron Job\n(toutes les 60s)

worker -> service : fetchAndSavePrices()
activate service

service -> coingecko : GET /coins/markets\n?vs_currency=usd&order=market_cap_desc
activate coingecko
coingecko --> service : JSON [top 100 cryptos]
deactivate coingecko

loop Pour chaque crypto
  service -> db : UPSERT crypto
  activate db
  db --> service : crypto saved
  deactivate db
  
  service -> db : INSERT crypto_prices
  activate db
  db --> service : price saved
  deactivate db
  
  service -> db : INSERT price_history
  activate db
  db --> service : history saved
  deactivate db
end

service --> worker : prices saved
deactivate service

worker -> indicator : calculateIndicators()
activate indicator

indicator -> db : SELECT price_history\nFOR each crypto
activate db
db --> indicator : historical data
deactivate db

indicator -> indicator : Calculate:\n- RSI\n- MACD\n- SMA\n- Bollinger Bands

indicator -> db : INSERT indicators_history
activate db
db --> indicator : indicators saved
deactivate db

indicator --> worker : indicators calculated
deactivate indicator

worker -> alert : checkAllAlerts()
activate alert

alert -> db : SELECT alerts\nWHERE is_triggered = false
activate db
db --> alert : active alerts
deactivate db

loop Pour chaque alerte
  alert -> alert : Vérifier condition\n(prix ou indicateur)
  
  alt Condition remplie
    alert -> db : UPDATE alert\nSET is_triggered = true
    activate db
    db --> alert : alert updated
    deactivate db
    
    alert -> sse : publishToUser(userId,\n"ALERT_TRIGGERED")
    activate sse
    sse --> users : SSE Notification
    deactivate sse
  end
end

alert --> worker : alerts checked
deactivate alert

worker -> sse : publishToRoles(['user'],\n"PRICE_UPDATE")
activate sse
sse --> users : Broadcast nouveaux prix
deactivate sse

deactivate worker

note right of worker
  Cycle complet: ~5-10 secondes
  Prochaine exécution: dans 60s
end note




skinparam shadowing false

node "Serveur Frontend" {
  component "Next.js\nApplication" as nextjs
  component "React\nComponents" as react
  component "SSE Client" as sseclient
  
  nextjs -- react
  react -- sseclient
}

node "Serveur Backend" {
  component "Express\nAPI Server" as express
  component "BullMQ\nWorkers" as workers
  component "SSE Server" as sseserver
  
  express -- workers
  express -- sseserver
}

database "PostgreSQL" {
  component "Base de données\nPrisma ORM" as postgres
}

database "Redis" {
  component "Cache\n& Queues" as redis
}

cloud "Services Externes" {
  component "CoinGecko\nAPI" as coingecko
  component "Firebase\nAuth" as firebase
  component "Discord\nOAuth" as discord
}

node "Client\nNavigateur" as browser

browser --> nextjs : HTTPS
nextjs --> express : REST API
sseclient --> sseserver : SSE Connection
express --> postgres : Prisma Client
workers --> postgres : Prisma Client
workers --> redis : BullMQ Jobs
workers --> coingecko : HTTP API
express --> firebase : Admin SDK
express --> discord : OAuth2
express --> redis : Cache

note right of workers
  - Price Collector
  - Alert Checker
  - Data Archiver
end note


