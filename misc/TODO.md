To do:
======

Milestone tasks
---------------

#### Core Game Mechanics

* [x] Create Engine
* [x] Networking
* [x] 3D rendering
* [x] Camera controls
* [x] Click-to-move
* [x] Pathfinding
* [x] Basic zombie AI
* [x] Cache objects (instead of loading them each time it is created)
* [ ] Swarm AI
* [x] Unit selection (selected object is selectedObj variable)
	* [x] Rewrite entire object naming system to allow selected units to be stored and used by the server
* [x] Health
* [x] Reproduction of units
* [x] Player attacking zombies
* [x] Player attacking players
* [x] Scoreboard
	* [x] Improve scoreboard
	* [ ] Restyle scoreboard
* [x] Win game
* [x] Building placement
	* [ ] Add more building types
	* [x] Add building health
	* [ ] Make buildings useful
* [x] Destructable buildings
* [x] Resource collection
* [ ] Resource sharing between units
* [x] Resource storing in buildings

#### Gameplay Elements

* [x] Grace period (set-up time)

Less important tasks
--------------------

* [ ] Fix height detection (optimise raytracing or predefine height)
* [ ] Create textures
* [ ] Add character animations
* [ ] Balance speed of units
* [x] Fix camera rotations for Player 2
* [x] Use a seperate thread for server-side processing, to help keep game running at a constant speed under stress (child_process/cluster?)
* [x] Make zombie spawn points (instead of tracked object position)
	* [ ] Refine zombie spawn points
* [x] Make player spawn points
	* [ ] Make object-specific spawn points
* [ ] Add background image
	* [ ] Make background image scroll with camera

Tasks to do over time
---------------------

* [x] Fix FPS lag
* [x] Fix latency issues
* [ ] Optimise memory usage
* [x] Optimise network usage
* [ ] Create tests (QUnit)
* [ ] Playtest game
* [ ] Clean up unused code (There is a lot of it)

Things to fix
-------------

* [x] Fix zombies not despawning when player disconnected
* [ ] Allow zombies to change target
* [ ] Allow for multiple levels to be loaded
* [ ] Stress test server for latency, stability and data integrity (networking)
* [x] Fix scaling of pathfinding data vs. real geometry position (pathfinding is currently off scale)
* [x] Rescale objects

Optional milestones
-------------------

* [ ] Procedural resource placement
* [ ] Procedural map generation
* [ ] Zombification of dead units
