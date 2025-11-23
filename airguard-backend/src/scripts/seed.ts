import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Airguard Demo Organization',
      owner: {
        create: {
          email: 'demo@airguard.com',
          passwordHash: '$2a$12$rldSLBnzKslyG.6Sad.wyO7sc.D.oL/ZHuMIop9t65ehNoxFZV0Ia', // password: demo123
          fullName: 'Demo User',
          country: 'United States',
          phoneNumber: '+1234567890',
          companyName: 'Airguard Demo Corp',
          industry: 'Technology',
          businessType: 'Corporation',
          hearAboutUs: 'Demo',
          nonGovernmentEndUser: false,
          acceptTerms: true,
          newsPromotions: true,
        }
      }
    },
    include: {
      owner: true
    }
  });

  // Update user with organization ID
  await prisma.user.update({
    where: { id: organization.owner.id },
    data: { organizationId: organization.id }
  });

  // Create sample devices
  const devices = await Promise.all([
    prisma.device.create({
      data: {
        name: 'AirGuard Device #001',
        deviceType: 'Environmental Monitor',
        firmwareVersion: 'v1.0.0',
        latitude: 33.8938 + 0.01,
        longitude: 35.5018 + 0.01,
        locationDescription: 'Downtown Beirut',
        status: 'online',
        batteryLevel: 85,
        lastSeen: new Date(),
        organizationId: organization.id
      }
    }),
    prisma.device.create({
      data: {
        name: 'AirGuard Device #002',
        deviceType: 'Network Monitor',
        firmwareVersion: 'v1.0.0',
        latitude: 33.8938 - 0.01,
        longitude: 35.5018 - 0.01,
        locationDescription: 'Beirut Port Area',
        status: 'online',
        batteryLevel: 92,
        lastSeen: new Date(),
        organizationId: organization.id
      }
    }),
    prisma.device.create({
      data: {
        name: 'AirGuard Device #003',
        deviceType: 'Environmental Monitor',
        firmwareVersion: 'v1.0.0',
        latitude: 33.8938 + 0.02,
        longitude: 35.5018 + 0.02,
        locationDescription: 'Beirut University District',
        status: 'warning',
        batteryLevel: 45,
        lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
        organizationId: organization.id
      }
    })
  ]);

  // Create sample device metrics
  for (const device of devices) {
    await Promise.all([
      prisma.deviceMetric.create({
        data: {
          metricType: 'throughput',
          value: 875.5,
          unit: 'Mbps',
          deviceId: device.id
        }
      }),
      prisma.deviceMetric.create({
        data: {
          metricType: 'health',
          value: 98.2,
          unit: '%',
          deviceId: device.id
        }
      }),
      prisma.deviceMetric.create({
        data: {
          metricType: 'qos',
          value: 99.1,
          unit: '%',
          deviceId: device.id
        }
      }),
      prisma.deviceMetric.create({
        data: {
          metricType: 'interference',
          value: -92.0,
          unit: 'dBm',
          deviceId: device.id
        }
      })
    ]);
  }

  // Create sample network health data
  await prisma.networkHealth.create({
    data: {
      healthIndex: 98.2,
      throughputMbps: 875.5,
      qosScore: 99.1,
      interferenceDbm: -92.0,
      predictedLoadPercent: 5.0,
      organizationId: organization.id
    }
  });

  // Create sample alerts
  await Promise.all([
    prisma.alert.create({
      data: {
        alertType: 'warning',
        title: 'Device Battery Low',
        message: 'Device #003 battery level is below 50%',
        severity: 'medium',
        organizationId: organization.id,
        deviceId: devices[2].id
      }
    }),
    prisma.alert.create({
      data: {
        alertType: 'success',
        title: 'Network Optimization Complete',
        message: 'Network optimization completed successfully',
        severity: 'low',
        organizationId: organization.id
      }
    }),
    prisma.alert.create({
      data: {
        alertType: 'info',
        title: 'New Device Connected',
        message: 'Device #002 has been connected to the network',
        severity: 'low',
        organizationId: organization.id,
        deviceId: devices[1].id
      }
    })
  ]);

  // Create sample achievements
  await Promise.all([
    prisma.achievement.create({
      data: {
        achievementType: 'electricity',
        title: 'Power Saver',
        description: 'Electricity conserved through smart monitoring',
        currentValue: 2847,
        unit: 'kWh',
        progressPercent: 85,
        currentLevel: 3,
        maxLevel: 5,
        nextLevelTarget: 3000,
        organizationId: organization.id
      }
    }),
    prisma.achievement.create({
      data: {
        achievementType: 'carbon',
        title: 'Carbon Crusher',
        description: 'CO₂ emissions prevented from entering atmosphere',
        currentValue: 1.2,
        unit: 'tons',
        progressPercent: 73,
        currentLevel: 2,
        maxLevel: 4,
        nextLevelTarget: 1.5,
        organizationId: organization.id
      }
    }),
    prisma.achievement.create({
      data: {
        achievementType: 'esg',
        title: 'ESG Excellence',
        description: 'Comprehensive sustainability reporting and compliance tracking',
        currentValue: 94,
        unit: 'score',
        progressPercent: 78,
        currentLevel: 4,
        maxLevel: 5,
        nextLevelTarget: 100,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`📧 Demo user email: demo@airguard.com`);
  console.log(`🔑 Demo user password: demo123`);
  console.log(`🏢 Organization: ${organization.name}`);
  console.log(`📱 Devices created: ${devices.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 