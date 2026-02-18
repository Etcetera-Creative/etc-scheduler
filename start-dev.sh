#!/bin/bash
cd /mnt/xavier_ssd/projects/etcetera-scheduler
export DATABASE_URL="postgresql://etcetera:etcetera@localhost:5433/etcetera_scheduler"
exec npx next dev -H 0.0.0.0
