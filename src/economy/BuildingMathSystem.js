/**
 * Building Mathematics and Production System
 * Handles all economic calculations for:
 * - Resource production
 * - Building efficiency
 * - Supply chain routing
 * - Economic optimization
 */
export class BuildingMathSystem {
    constructor() {
        this.buildings = new Map();
        this.productionChains = new Map();
        this.routes = [];
        this.resourcePrices = new Map();
        
        this.initializeEconomicData();
        console.log('💰 Building Math System initialized');
    }

    initializeEconomicData() {
        // Base resource prices
        this.resourcePrices.set('iron_ore', 10);
        this.resourcePrices.set('copper_ore', 12);
        this.resourcePrices.set('aluminum', 15);
        this.resourcePrices.set('steel', 50);
        this.resourcePrices.set('copper_wire', 35);
        this.resourcePrices.set('circuits', 120);
        this.resourcePrices.set('chemicals', 25);
        this.resourcePrices.set('polymers', 40);
        this.resourcePrices.set('energy', 5);
        this.resourcePrices.set('fuel', 30);
    }

    /**
     * Register a building with production capabilities
     */
    registerBuilding(buildingData) {
        const {
            id,
            type,
            position,
            planet,
            resources = [],      // Input resources
            produces,            // Output resource
            productionRate,      // Units per hour
            efficiency = 1.0,    // 0-1 multiplier
            workers = 0,         // Worker slots
            powerRequired = 0,   // Power consumption
            maintenanceCost = 0  // Credits per hour
        } = buildingData;

        const building = {
            id,
            type,
            position,
            planet,
            resources,
            produces,
            baseProductionRate: productionRate,
            efficiency,
            workers,
            maxWorkers: workers,
            powerRequired,
            basePower: powerRequired,
            maintenanceCost,
            active: true,
            inventory: new Map(),
            outputBuffer: 0,
            lastUpdate: Date.now()
        };

        this.buildings.set(id, building);
        console.log(`🏭 Registered ${type} building: ${id}`);
        
        return building;
    }

    /**
     * Calculate actual production for a building
     */
    calculateProduction(buildingId, deltaTime) {
        const building = this.buildings.get(buildingId);
        if (!building || !building.active) return 0;

        // Base production rate (units per hour converted to per second)
        const baseRate = building.baseProductionRate / 3600;

        // Worker efficiency: (workers / maxWorkers)^0.8 
        // Diminishing returns on workers
        const workerRatio = building.workers / building.maxWorkers;
        const workerEfficiency = Math.pow(workerRatio, 0.8);

        // Power efficiency: 
        // 100% power = 100% efficiency
        // 50% power = 70% efficiency  
        // 0% power = 0% efficiency
        const powerRatio = building.powerAvailable / building.powerRequired;
        const powerEfficiency = powerRatio <= 0 ? 0 : 
                               Math.min(1, 0.5 + powerRatio * 0.5);

        // Resource availability check
        const resourceEfficiency = this.checkResourceAvailability(building);

        // Quality of resources bonus (1.0 - 1.5x)
        const qualityBonus = this.calculateQualityBonus(building);

        // Total efficiency calculation
        const totalEfficiency = building.efficiency * 
                               workerEfficiency * 
                               powerEfficiency * 
                               resourceEfficiency * 
                               qualityBonus;

        // Final production amount
        const production = baseRate * totalEfficiency * deltaTime;

        // Consume input resources
        this.consumeResources(building, production);

        // Add to output buffer
        building.outputBuffer += production;

        // Update metrics
        building.lastProductionRate = production / deltaTime * 3600; // per hour
        building.lastEfficiency = totalEfficiency;

        return production;
    }

    /**
     * Check if building has required resources
     */
    checkResourceAvailability(building) {
        if (building.resources.length === 0) return 1.0;

        let availabilitySum = 0;
        
        for (const resource of building.resources) {
            const available = building.inventory.get(resource.type) || 0;
            const required = resource.amount;
            
            const ratio = Math.min(1, available / required);
            availabilitySum += ratio;
        }

        // Average availability across all resources
        return availabilitySum / building.resources.length;
    }

    /**
     * Calculate quality bonus from input resources
     */
    calculateQualityBonus(building) {
        if (building.resources.length === 0) return 1.0;

        let qualitySum = 0;
        
        for (const resource of building.resources) {
            const quality = resource.quality || 500; // 0-1000 scale
            // Convert 0-1000 to 1.0-1.5 multiplier
            const bonus = 1.0 + (quality / 1000) * 0.5;
            qualitySum += bonus;
        }

        return qualitySum / building.resources.length;
    }

    /**
     * Consume input resources for production
     */
    consumeResources(building, productionAmount) {
        for (const resource of building.resources) {
            const consumed = resource.amount * productionAmount;
            const current = building.inventory.get(resource.type) || 0;
            building.inventory.set(resource.type, Math.max(0, current - consumed));
        }
    }

    /**
     * Calculate maintenance cost for a building
     */
    calculateMaintenanceCost(buildingId, hours = 1) {
        const building = this.buildings.get(buildingId);
        if (!building) return 0;

        // Base maintenance
        let cost = building.maintenanceCost * hours;

        // Increased cost for higher production
        const productionFactor = building.lastProductionRate / building.baseProductionRate;
        cost *= (1 + productionFactor * 0.2);

        // Degradation over time (needs repairs)
        const age = (Date.now() - building.lastUpdate) / (1000 * 3600 * 24); // days
        const degradation = 1 + (age / 30) * 0.1; // 10% increase per month
        cost *= degradation;

        return Math.round(cost);
    }

    /**
     * Calculate profit for a building's production
     */
    calculateProfit(buildingId, timeframe = 1) {
        const building = this.buildings.get(buildingId);
        if (!building) return 0;

        // Revenue from output
        const outputPrice = this.resourcePrices.get(building.produces) || 0;
        const revenue = building.lastProductionRate * timeframe * outputPrice;

        // Cost of input resources
        let inputCost = 0;
        for (const resource of building.resources) {
            const price = this.resourcePrices.get(resource.type) || 0;
            const consumed = resource.amount * building.lastProductionRate * timeframe;
            inputCost += consumed * price;
        }

        // Operating costs
        const maintenance = this.calculateMaintenanceCost(buildingId, timeframe);
        const powerCost = building.powerRequired * timeframe * 2; // 2 credits per power unit
        const workerWages = building.workers * 50 * timeframe; // 50 credits per worker per hour

        const profit = revenue - inputCost - maintenance - powerCost - workerWages;

        return {
            revenue,
            inputCost,
            maintenance,
            powerCost,
            workerWages,
            totalCost: inputCost + maintenance + powerCost + workerWages,
            profit,
            profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0
        };
    }

    /**
     * Create a production chain connecting multiple buildings
     */
    createProductionChain(chainConfig) {
        const {
            id,
            name,
            buildings,  // Array of building IDs in production order
            autoRoute = true
        } = chainConfig;

        const chain = {
            id,
            name,
            buildings,
            routes: [],
            efficiency: 0,
            bottlenecks: [],
            autoRoute
        };

        // Create routes between buildings
        if (autoRoute) {
            for (let i = 0; i < buildings.length - 1; i++) {
                const from = buildings[i];
                const to = buildings[i + 1];
                
                const route = this.createRoute({
                    from,
                    to,
                    resource: this.buildings.get(from).produces,
                    priority: 1
                });
                
                chain.routes.push(route.id);
            }
        }

        this.productionChains.set(id, chain);
        console.log(`⛓️ Created production chain: ${name}`);
        
        return chain;
    }

    /**
     * Create a route between two buildings
     */
    createRoute(routeConfig) {
        const {
            from,
            to,
            resource,
            transportType = 'auto',  // auto, conveyor, vehicle, pipeline
            capacity = 1000,         // Units per hour
            priority = 5,            // 1-10, higher = more important
            cost = 0                 // Credits per unit transported
        } = routeConfig;

        const fromBuilding = this.buildings.get(from);
        const toBuilding = this.buildings.get(to);

        if (!fromBuilding || !toBuilding) {
            console.error('Invalid buildings for route');
            return null;
        }

        // Calculate distance for transport cost
        const distance = this.calculateDistance(
            fromBuilding.position,
            toBuilding.position
        );

        const route = {
            id: `route_${from}_${to}_${Date.now()}`,
            from,
            to,
            resource,
            transportType,
            capacity,
            priority,
            distance,
            baseCost: cost || this.calculateTransportCost(transportType, distance),
            active: true,
            throughput: 0,
            congestion: 0
        };

        this.routes.push(route);
        console.log(`🚚 Created route: ${from} → ${to} (${resource})`);
        
        return route;
    }

    /**
     * Calculate transport cost based on type and distance
     */
    calculateTransportCost(type, distance) {
        const costs = {
            auto: 0.1,      // Automated, low cost
            conveyor: 0.05, // Very efficient for short distances
            vehicle: 0.2,   // Flexible but expensive
            pipeline: 0.03  // Best for liquids/gases
        };

        const baseCost = costs[type] || 0.1;
        return baseCost * distance / 100; // Cost per unit per 100m
    }

    /**
     * Calculate distance between two positions
     */
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Optimize routes for maximum efficiency
     */
    optimizeRoutes() {
        console.log('🔧 Optimizing production routes...');

        // Sort routes by priority and congestion
        this.routes.sort((a, b) => {
            // Higher priority first
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            // Lower congestion first
            return a.congestion - b.congestion;
        });

        // Identify bottlenecks
        const bottlenecks = [];
        for (const route of this.routes) {
            const fromBuilding = this.buildings.get(route.from);
            if (!fromBuilding) continue;

            // Check if output exceeds route capacity
            if (fromBuilding.lastProductionRate > route.capacity) {
                bottlenecks.push({
                    route: route.id,
                    shortage: fromBuilding.lastProductionRate - route.capacity,
                    severity: (fromBuilding.lastProductionRate / route.capacity) - 1
                });
            }
        }

        if (bottlenecks.length > 0) {
            console.warn(`⚠️ Found ${bottlenecks.length} bottlenecks in routes`);
        }

        return {
            optimized: this.routes.length,
            bottlenecks
        };
    }

    /**
     * Update all buildings and routes
     */
    update(deltaTime) {
        const dt = deltaTime || 1;

        // Update all buildings
        for (const [id, building] of this.buildings) {
            if (building.active) {
                this.calculateProduction(id, dt);
            }
        }

        // Transfer resources along routes
        for (const route of this.routes) {
            if (route.active) {
                this.transferResources(route, dt);
            }
        }

        // Update production chains
        for (const [id, chain] of this.productionChains) {
            this.updateChainEfficiency(id);
        }
    }

    /**
     * Transfer resources along a route
     */
    transferResources(route, deltaTime) {
        const fromBuilding = this.buildings.get(route.from);
        const toBuilding = this.buildings.get(route.to);

        if (!fromBuilding || !toBuilding) return;

        // Amount available to transfer
        const available = fromBuilding.outputBuffer;
        
        // Amount that can be transported this tick
        const capacity = route.capacity / 3600 * deltaTime; // per second
        
        // Amount the destination can accept
        const toInventory = toBuilding.inventory.get(route.resource) || 0;
        const toCapacity = 10000; // Buildings have 10k inventory cap
        const spaceAvailable = Math.max(0, toCapacity - toInventory);

        // Actual transfer amount
        const transfer = Math.min(available, capacity, spaceAvailable);

        if (transfer > 0) {
            // Remove from source
            fromBuilding.outputBuffer -= transfer;
            
            // Add to destination
            toBuilding.inventory.set(route.resource, toInventory + transfer);
            
            // Update route metrics
            route.throughput = transfer / deltaTime * 3600; // per hour
            route.congestion = transfer / capacity;
        }
    }

    /**
     * Update efficiency metrics for a production chain
     */
    updateChainEfficiency(chainId) {
        const chain = this.productionChains.get(chainId);
        if (!chain) return;

        // Calculate overall chain efficiency
        let totalEfficiency = 0;
        let activeBuildings = 0;

        for (const buildingId of chain.buildings) {
            const building = this.buildings.get(buildingId);
            if (building && building.active) {
                totalEfficiency += building.lastEfficiency || 0;
                activeBuildings++;
            }
        }

        chain.efficiency = activeBuildings > 0 ? totalEfficiency / activeBuildings : 0;

        // Identify bottlenecks in chain
        chain.bottlenecks = [];
        for (let i = 0; i < chain.buildings.length - 1; i++) {
            const current = this.buildings.get(chain.buildings[i]);
            const next = this.buildings.get(chain.buildings[i + 1]);

            if (current && next) {
                // If next building is starved for resources
                const nextInventory = next.inventory.get(current.produces) || 0;
                if (nextInventory < 100) { // Less than 100 units
                    chain.bottlenecks.push({
                        building: next.id,
                        issue: 'resource_shortage',
                        resource: current.produces
                    });
                }
            }
        }
    }

    /**
     * Get comprehensive stats for all buildings
     */
    getSystemStats() {
        let totalProduction = 0;
        let totalRevenue = 0;
        let totalCosts = 0;
        let activeBuildings = 0;

        for (const [id, building] of this.buildings) {
            if (building.active) {
                activeBuildings++;
                totalProduction += building.lastProductionRate || 0;
                
                const profit = this.calculateProfit(id, 1);
                totalRevenue += profit.revenue;
                totalCosts += profit.totalCost;
            }
        }

        return {
            buildings: this.buildings.size,
            activeBuildings,
            routes: this.routes.length,
            chains: this.productionChains.size,
            totalProduction,
            totalRevenue,
            totalCosts,
            netProfit: totalRevenue - totalCosts,
            averageEfficiency: activeBuildings > 0 ? 
                Array.from(this.buildings.values())
                    .reduce((sum, b) => sum + (b.lastEfficiency || 0), 0) / activeBuildings : 0
        };
    }
}
