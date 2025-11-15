import { NextResponse } from 'next/server';
import { getAllUsageRecords } from '@/lib/dynamodb';
import { calculateDashboardStats } from '@/lib/stats';
import { mockUsageData, isDemoMode } from '@/lib/mock-data';
import { checkPricingFreshness } from '@/lib/openai-pricing';

// Configuración para forzar ejecución dinámica (sin caché)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Verificar si los precios de OpenAI están actualizados
    checkPricingFreshness();
    
    // Si está en modo demo, usar datos de prueba
    if (isDemoMode()) {
      console.log('🔧 Modo Demo: Usando datos de ejemplo');
      const stats = calculateDashboardStats(mockUsageData);
      
      const response = NextResponse.json({
        success: true,
        demo: true,
        data: {
          stats,
          records: mockUsageData,
        },
      });
      
      // Headers para desactivar caché
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    }

    // Modo producción: obtener datos de DynamoDB
    const records = await getAllUsageRecords();
    const stats = calculateDashboardStats(records);
    
    const response = NextResponse.json({
      success: true,
      demo: false,
      data: {
        stats,
        records,
      },
    });
    
    // Headers para desactivar caché
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error en API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

