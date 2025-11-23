/**
 * Script to fix users without organizations
 * This ensures all users have an organization assigned for multi-tenancy
 */

import { PrismaClient } from '@prisma/client';
import logger from '@/config/logger';

const prisma = new PrismaClient();

async function fixUserOrganizations() {
  try {
    logger.info('Starting user organization fix...');

    // Find all users without an organization
    const usersWithoutOrg = await prisma.user.findMany({
      where: {
        organizationId: null
      }
    });

    logger.info(`Found ${usersWithoutOrg.length} users without organizations`);

    for (const user of usersWithoutOrg) {
      logger.info(`Fixing user: ${user.email} (${user.id})`);

      // Create organization for this user
      const organization = await prisma.organization.create({
        data: {
          name: user.companyName || `${user.fullName}'s Organization`,
          ownerId: user.id
        }
      });

      // Update user with organization ID
      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id }
      });

      logger.info(`✅ Created organization ${organization.id} for user ${user.email}`);
    }

    logger.info('✅ User organization fix completed successfully');

    // Verify all users now have organizations
    const remainingUsersWithoutOrg = await prisma.user.count({
      where: {
        organizationId: null
      }
    });

    if (remainingUsersWithoutOrg === 0) {
      logger.info('✅ All users now have organizations');
    } else {
      logger.warn(`⚠️  ${remainingUsersWithoutOrg} users still without organizations`);
    }

  } catch (error) {
    logger.error('Error fixing user organizations', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixUserOrganizations()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
